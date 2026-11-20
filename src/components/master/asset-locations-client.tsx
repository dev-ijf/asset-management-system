"use client";

import {
  createAssetLocationAction,
  deleteAssetLocationAction,
  updateAssetLocationAction,
} from "@/app/(dashboard)/dashboard/master/asset-location-actions";
import {
  HierarchyCreateAction,
  HierarchyRowActions,
  type HierarchyActions,
  type HierarchyOption,
  type HierarchyRow,
} from "@/components/master/hierarchy-master-client";

export type AssetLocationOption = HierarchyOption;
export type AssetLocationRow = HierarchyRow;

const actions: HierarchyActions = {
  create: createAssetLocationAction,
  update: updateAssetLocationAction,
  remove: deleteAssetLocationAction,
};

export function AssetLocationCreateAction({ canManage, parentOptions }: { canManage: boolean; parentOptions: AssetLocationOption[] }) {
  return <HierarchyCreateAction kind="location" actions={actions} canManage={canManage} options={parentOptions} />;
}

export function AssetLocationRowActions({
  canManage,
  location,
  parentOptions,
}: {
  canManage: boolean;
  location: AssetLocationRow;
  parentOptions: AssetLocationOption[];
}) {
  return <HierarchyRowActions kind="location" actions={actions} canManage={canManage} record={location} options={parentOptions} />;
}
