"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import PortfolioItemForm from "./PortfolioItemForm";
import {
  Edit,
  MoreVertical,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

interface PortfolioItemListProps {
  portfolioItems: {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string;
  }[];
  vendorId: number;
}

export default function PortfolioItemList({
  portfolioItems,
  vendorId,
}: PortfolioItemListProps) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/vendor/portfolio/${selectedItem.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete portfolio item");
      }

      toast({
        title: "Portfolio item deleted",
        description: "The portfolio item has been successfully deleted.",
      });

      setIsDeleteDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem deleting the portfolio item.",
      });
      console.error("Error deleting portfolio item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (portfolioItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No portfolio items yet</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          Start showcasing your work by adding your first portfolio item. This
          will help candidates see your expertise.
        </p>
        <Button
          onClick={() => (document.querySelector('[data-value="add"]') as HTMLButtonElement)?.click()}
          variant="default"
        >
          Add Your First Portfolio Item
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {portfolioItems.map((item) => (
        <Card key={item.id} className="h-full flex flex-col">
          <div className="relative aspect-video w-full overflow-hidden">
            {item.imageUrl ? (
              <div className="relative h-full w-full">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="object-cover h-full w-full"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gray-100">
                <ImageIcon className="h-12 w-12 text-gray-300" />
              </div>
            )}
          </div>

          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="-mr-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedItem(item);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="flex-grow">
            <p className="text-sm text-gray-600 line-clamp-3">
              {item.description || "No description provided."}
            </p>
          </CardContent>

          {item.imageUrl && (
            <CardFooter className="pt-0">
              <a
                href={item.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:underline flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Original Image
              </a>
            </CardFooter>
          )}
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Portfolio Item</DialogTitle>
            <DialogDescription>
              Update the details of your portfolio item.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <PortfolioItemForm
              vendorId={vendorId}
              portfolioItem={selectedItem}
              onSuccess={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this portfolio item? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
