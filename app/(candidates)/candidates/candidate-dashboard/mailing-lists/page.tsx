"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailingListTable } from "./MailingListTable";
import { CreateListForm } from "./CreateListForm"; // We'll make this a dialog trigger
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { usePageTitle } from "@/lib/usePageTitle";

// Placeholder data - replace with actual fetched data
const placeholderLists = [
  {
    id: 1,
    name: "General Newsletter",
    subscriberCount: 45,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
  },
  {
    id: 2,
    name: "Volunteer Updates",
    subscriberCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
];

export default function MailingListsPage() {
  usePageTitle("Candidate Dashboard – Mailing Lists");
  const [lists, setLists] = React.useState(placeholderLists); // Use state to manage lists
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // Callback function to add a new list (placeholder)
  const handleListCreated = (newList: {
    id: number;
    name: string;
    subscriberCount: number;
    createdAt: Date;
  }) => {
    setLists((prev) => [...prev, newList]);
    setIsCreateDialogOpen(false); // Close dialog after creation
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Mailing Lists</h1>
        {/* Dialog Trigger Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Mailing List</DialogTitle>
              <DialogDescription>
                Set up a new list for subscribers.
              </DialogDescription>
            </DialogHeader>
            {/* Render form inside the dialog */}
            <CreateListForm onListCreated={handleListCreated} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Lists</CardTitle>
          <CardDescription>
            Manage your mailing lists and view subscribers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MailingListTable lists={lists} />
        </CardContent>
      </Card>

      {/* Placeholder for overall stats */}
      {/* <Card>
         <CardHeader><CardTitle>Overall Stats</CardTitle></CardHeader>
         <CardContent>
           <p>Total Subscribers: {lists.reduce((sum, list) => sum + list.subscriberCount, 0)}</p>
         </CardContent>
       </Card> */}
    </div>
  );
}
