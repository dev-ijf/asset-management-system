"use client";

import { createDepartmentAction, deleteDepartmentAction, updateDepartmentAction } from "@/app/(dashboard)/dashboard/master/department-actions";
import {
  HierarchyCreateAction,
  HierarchyRowActions,
  type HierarchyActions,
  type HierarchyOption,
  type HierarchyRow,
} from "@/components/master/hierarchy-master-client";

const actions: HierarchyActions = {
  create: createDepartmentAction,
  update: updateDepartmentAction,
  remove: deleteDepartmentAction,
};

export function DepartmentCreateAction({ canManage, options }: { canManage: boolean; options: HierarchyOption[] }) {
  return <HierarchyCreateAction kind="department" actions={actions} canManage={canManage} options={options} />;
}

export function DepartmentRowActions({ canManage, record, options }: { canManage: boolean; record: HierarchyRow; options: HierarchyOption[] }) {
  return <HierarchyRowActions kind="department" actions={actions} canManage={canManage} record={record} options={options} />;
}
