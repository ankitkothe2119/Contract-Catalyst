"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { DollarSign, Calendar, CalendarClock, TrendingUp, Clipboard } from "lucide-react";
import { toWords } from 'number-to-words';

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const currentYear = new Date().getFullYear();

const formSchema = z.object({
  contractValue: z.coerce.number({ required_error: "Contract value is required." }).positive({ message: "Contract value must be a positive number." }),
  issueYear: z.coerce.number({ required_error: "Issue year is required." }).int().min(1900, `Year must be 1900 or later.`).max(currentYear, `Year cannot be in the future.`),
  renewalYear: z.coerce.number({ required_error: "Renewal year is required." }).int().min(1900, `Year must be 1900 or later.`),
}).refine(data => data.renewalYear > data.issueYear, {
  message: "Renewal year must be after the issue year.",
  path: ["renewalYear"],
});

type FormValues = z.infer<typeof formSchema>;

export function ContractCalculator() {
  const [result, setResult] = useState<number | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contractValue: undefined,
      issueYear: undefined,
      renewalYear: undefined,
    },
  });

  function onSubmit(data: FormValues) {
    const { contractValue, renewalYear, issueYear } = data;
    const yearsDifference = renewalYear - issueYear;
    
    if (yearsDifference <= 0) {
      // This case should be handled by zod refinement, but as a fallback:
      form.setError("renewalYear", { type: "manual", message: "Renewal year must be greater than issue year." });
      return;
    }

    const value1 = contractValue / (yearsDifference * 12);
    const value2 = value1 * 10.33;
    const finalAnswer = (value2 / 100) + value1;

    setResult(finalAnswer);
  }

  const resultInWords = (num: number | null) => {
    if (num === null) return '';
    const fixedNum = num.toFixed(3);
    const [integerPart, fractionalPart] = fixedNum.split('.');
    const integerWords = toWords(Number(integerPart));
    const fractionalWords = fractionalPart.split('').map(digit => toWords(Number(digit))).join(' ');
    
    const words = `${integerWords} point ${fractionalWords}`;
    return words.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  const handleCopy = () => {
    if (result === null) return;

    const textToCopy = [
      `Adjusted Monthly Value: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(result)}`,
      `In Words: ${resultInWords(result)}`,
      'Not Applicable'
    ].join('\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({
        title: "Copied to clipboard!",
        description: "The result details have been copied.",
      });
    });
  };

  return (
    <div className="w-full max-w-md">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Contract Catalyst
          </CardTitle>
          <CardDescription>
            Enter your contract details to calculate its adjusted monthly value.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="contractValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Contract Value
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50000" {...field} step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issueYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Issue Year
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={`e.g., ${currentYear - 2}`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="renewalYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      Renewal Year
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={`e.g., ${currentYear + 1}`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" size="lg">Calculate</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      {result !== null && (
        <Card className="mt-6 w-full bg-primary/10 border-primary/20 animate-in fade-in zoom-in-95">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="font-headline text-xl">Adjusted Monthly Value</CardTitle>
                <CardDescription>This is the calculated value based on your inputs.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopy}>
                <Clipboard className="h-5 w-5" />
                <span className="sr-only">Copy results</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-4xl font-bold text-primary font-headline">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(result)}
            </p>
            <p className="text-sm text-muted-foreground pt-2">{resultInWords(result)}</p>
            <p className="text-sm text-muted-foreground">Not Applicable</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
