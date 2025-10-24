"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/alert-dialog";
import { Button } from '@/ui/button';
import { IoTrashOutline } from 'react-icons/io5';
import { displayedText } from "@/presentation/translations";

type DeleteButtonProps =
{
    id: string;
    isPending: boolean;
    deleteAction: (id: string) => void;
}

export default function DeleteButton({ id, isPending, deleteAction }: DeleteButtonProps)
{
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="destructive" 
                    size='icon' 
                    className="my-4 hover:text-red-950"
                    disabled={isPending}
                >
                    <IoTrashOutline />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{displayedText.deleteConfirmation}</AlertDialogTitle>
                    <AlertDialogDescription>{displayedText.deleteConfirmationDescription}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel className="capitalize">{displayedText.cancel}</AlertDialogCancel>
                <AlertDialogAction disabled={isPending} onClick={() => deleteAction(id) }>
                    {isPending ? displayedText.deleting : displayedText.delete}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}