import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/ui/item";

export default function EditPerkView()
{
    return (
        <Item>
            <ItemContent>
            <ItemTitle>Default Variant</ItemTitle>
            <ItemDescription>
                Standard styling with subtle background and borders.
            </ItemDescription>
            </ItemContent>
            <ItemActions>
            {/* <Button variant="outline" size="sm">
                Open
            </Button> */}
            </ItemActions>
            <ItemFooter>
            <span className="text-sm text-muted-foreground">
                Additional footer information
            </span>
            </ItemFooter>
        </Item>
    );
};