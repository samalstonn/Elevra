"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Users } from "lucide-react"; // Icons
import { format } from "date-fns"; // Date formatting

// Define the expected shape of list data
interface MailingList {
  id: number;
  name: string;
  subscriberCount: number;
  createdAt: Date;
}

interface MailingListTableProps {
  lists: MailingList[];
}

export function MailingListTable({ lists }: MailingListTableProps) {
  const handleDelete = (listId: number) => {
    // Placeholder for delete functionality
    console.log("Delete list:", listId);
    alert(`Placeholder: Delete list ${listId} (backend not implemented)`);
    // TODO: Call API to delete the list and update state in parent component
  };

  const handleViewSubscribers = (listId: number) => {
    // Placeholder for navigation or modal
    console.log("View subscribers for list:", listId);
    alert(
      `Placeholder: View subscribers for ${listId} (feature not implemented)`
    );
    // TODO: Navigate to a subscriber page or open a modal
  };

  if (lists.length === 0) {
    return (
      <p className="text-center text-gray-500 py-4">
        You haven't created any mailing lists yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>List Name</TableHead>
          <TableHead className="text-center">Subscribers</TableHead>
          <TableHead>Created On</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lists.map((list) => (
          <TableRow key={list.id}>
            <TableCell className="font-medium">{list.name}</TableCell>
            <TableCell className="text-center">
              {list.subscriberCount}
            </TableCell>
            <TableCell>{format(new Date(list.createdAt), "PP")}</TableCell>
            {/* Removed the whitespace and comment that was here */}
            <TableCell className="text-right space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewSubscribers(list.id)}
              >
                <Users className="h-4 w-4 mr-1" /> View
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(list.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
