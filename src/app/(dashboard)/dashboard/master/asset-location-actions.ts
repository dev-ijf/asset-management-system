"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AssetLocationActionState = {
  ok?: boolean;
  message?: string;
  errors?: {
    name?: string;
    parentId?: string;
    description?: string;
    form?: string;
  };
};

const ASSET_LOCATIONS_PATH = "/dashboard/master/asset-locations";

function readAssetLocationForm(formData: FormData) {
  return {
    id: String(formData.get("id") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    parentId: String(formData.get("parentId") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  };
}

async function validateAssetLocationInput(input: ReturnType<typeof readAssetLocationForm>, ignoreId?: string) {
  const errors: AssetLocationActionState["errors"] = {};

  if (!input.name) {
    errors.name = "Name wajib diisi.";
  }

  if (input.parentId) {
    if (input.parentId === ignoreId) {
      errors.parentId = "Parent location tidak boleh memilih dirinya sendiri.";
    } else {
      const parent = await prisma.assetLocation.findUnique({
        where: { id: input.parentId },
        select: { id: true, parentId: true },
      });

      if (!parent) {
        errors.parentId = "Parent location tidak ditemukan.";
      }

      let currentParentId = parent?.parentId ?? null;

      while (ignoreId && currentParentId) {
        if (currentParentId === ignoreId) {
          errors.parentId = "Parent location tidak boleh berasal dari turunannya sendiri.";
          break;
        }

        const currentParent = await prisma.assetLocation.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });

        currentParentId = currentParent?.parentId ?? null;
      }
    }
  }

  return errors;
}

function hasErrors(errors: AssetLocationActionState["errors"]) {
  return Boolean(errors && Object.keys(errors).length > 0);
}

async function generateAssetLocationCode() {
  const locations = await prisma.assetLocation.findMany({
    where: {
      code: {
        startsWith: "LOC-",
      },
    },
    select: {
      code: true,
    },
  });

  const lastNumber = locations.reduce((max, location) => {
    const match = /^LOC-(\d+)$/.exec(location.code);

    if (!match) {
      return max;
    }

    return Math.max(max, Number(match[1]));
  }, 0);

  return `LOC-${String(lastNumber + 1).padStart(3, "0")}`;
}

export async function createAssetLocationAction(
  _previousState: AssetLocationActionState,
  formData: FormData,
): Promise<AssetLocationActionState> {
  await requirePermission("assets.manage");

  const input = readAssetLocationForm(formData);
  const errors = await validateAssetLocationInput(input);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    const code = await generateAssetLocationCode();

    await prisma.assetLocation.create({
      data: {
        code,
        name: input.name,
        parentId: input.parentId || null,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        errors: {
          form: "Code lokasi otomatis sudah digunakan oleh request lain. Coba simpan ulang.",
        },
      };
    }

    return { errors: { form: "Asset location gagal dibuat. Coba lagi." } };
  }

  revalidatePath(ASSET_LOCATIONS_PATH);

  return { ok: true, message: "Asset location berhasil ditambahkan." };
}

export async function updateAssetLocationAction(
  _previousState: AssetLocationActionState,
  formData: FormData,
): Promise<AssetLocationActionState> {
  await requirePermission("assets.manage");

  const input = readAssetLocationForm(formData);

  if (!input.id) {
    return { errors: { form: "Asset location tidak valid." } };
  }

  const errors = await validateAssetLocationInput(input, input.id);

  if (hasErrors(errors)) {
    return { errors };
  }

  try {
    await prisma.assetLocation.update({
      where: { id: input.id },
      data: {
        name: input.name,
        parentId: input.parentId || null,
        description: input.description || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset location tidak ditemukan." } };
    }

    return { errors: { form: "Asset location gagal diperbarui. Coba lagi." } };
  }

  revalidatePath(ASSET_LOCATIONS_PATH);

  return { ok: true, message: "Asset location berhasil diperbarui." };
}

export async function deleteAssetLocationAction(
  _previousState: AssetLocationActionState,
  formData: FormData,
): Promise<AssetLocationActionState> {
  await requirePermission("assets.manage");

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { errors: { form: "Asset location tidak valid." } };
  }

  const usedByAssets = await prisma.asset.count({
    where: { assetLocationId: id },
  });

  if (usedByAssets > 0) {
    return {
      errors: {
        form: `Asset location tidak bisa dihapus karena masih dipakai oleh ${usedByAssets} aset.`,
      },
    };
  }

  const usedByChildren = await prisma.assetLocation.count({
    where: { parentId: id },
  });

  if (usedByChildren > 0) {
    return {
      errors: {
        form: `Asset location tidak bisa dihapus karena masih memiliki ${usedByChildren} child location.`,
      },
    };
  }

  try {
    await prisma.assetLocation.delete({
      where: { id },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { errors: { form: "Asset location tidak ditemukan." } };
    }

    return { errors: { form: "Asset location gagal dihapus. Coba lagi." } };
  }

  revalidatePath(ASSET_LOCATIONS_PATH);

  return { ok: true, message: "Asset location berhasil dihapus." };
}
