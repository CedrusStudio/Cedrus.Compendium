import { Mode } from "@/domain/Character";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function ModesCard({ name, modes }: { name: string, modes: Mode[]})
{
  return (
    <Card className='bg-muted'>
      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{name}</CardTitle>
      </CardHeader>

      <CardContent className='flex flex-col gap-y-4'>
        <RadioGroup defaultValue="comfortable">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="None" id="None" />
            <Label htmlFor="None">None</Label>
          </div>

          {
            modes.map(mode => (
              <div key={mode.name} className="flex items-center gap-3">
                <RadioGroupItem value={mode.name} id={mode.name} />
                <Label htmlFor={mode.name}>
                  <span className="capitalize font-bold">{mode.name} {mode.grade}:</span> {mode.description}
                </Label>
              </div>
            ))
          }
        </RadioGroup>
      </CardContent>

    </Card>
  );
};