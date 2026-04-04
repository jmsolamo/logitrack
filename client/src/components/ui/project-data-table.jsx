import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// --- STATUS BADGE VARIANTS ---
const statusBadgeVariants = cva("capitalize text-white", {
  variants: {
    variant: {
      active: "bg-green-500 hover:bg-green-600",
      inProgress: "bg-yellow-500 hover:bg-yellow-600",
      onHold: "bg-red-500 hover:bg-red-600",
    },
  },
  defaultVariants: {
    variant: "active",
  },
});

// --- MAIN COMPONENT ---
export const ProjectDataTable = ({ projects, visibleColumns, columns, renderCell }) => {
  // Animation variants for table rows
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeInOut",
      },
    }),
  };

  const visibleHeaders = columns.filter((col) => visibleColumns.has(col.key));

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleHeaders.map((header) => (
                <TableHead key={header.key}>{header.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length > 0 ? (
              projects.map((project, index) => (
                <motion.tr
                  key={project._id || project.id || index}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={rowVariants}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  {visibleHeaders.map((header) => (
                    <TableCell key={header.key}>
                      {renderCell ? renderCell(header.key, project) : project[header.key]}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleHeaders.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export { statusBadgeVariants };
