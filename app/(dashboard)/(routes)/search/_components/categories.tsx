"use client";

import { Category } from "@/lib/generated/prisma";
import {
  FcEngineering,
  FcFilmReel,
  FcMultipleDevices,
  FcMusic,
  FcOldTimeCamera,
  FcSalesPerformance,
  FcSportsMode,
  FcBusinessman
} from "react-icons/fc";
import { IconType } from "react-icons";

import { CategoryItem } from "./category-item";
import { Suspense } from 'react'

interface CategoriesProps {
  items: Category[];
}

const iconMap: Record<Category["name"], IconType> = {
  "Music": FcMusic,
  "Photography": FcOldTimeCamera,
  "Fitness": FcSportsMode,
  "Accounting": FcSalesPerformance,
  "Computer Science": FcMultipleDevices,
  "Filming": FcFilmReel,
  "Engineering": FcEngineering,
  "Business": FcBusinessman,
};

function SearchBarFallback() {
  return <>placeholder</>;
}

export const Categories = ({
  items,
}: CategoriesProps) => {
  return (
    <div className="flex items-center gap-x-2 overflow-x-auto pb-2">
      {items.map((item) => (
        <Suspense key={item.id} fallback={<SearchBarFallback />}>
          <CategoryItem
            label={item.name}
            icon={iconMap[item.name]}
            value={item.id}
          />
        </Suspense>
      ))}
    </div>
  );
};

