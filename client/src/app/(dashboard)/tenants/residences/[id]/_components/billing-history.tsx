import { ArrowDownToLineIcon, Check, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Payment } from "@/types/prisma";
import { downloadPaymentRecord, downloadPaymentsCsv } from "@/lib/downloads";

const BillingHistory = ({ payments }: { payments: Payment[] }) => {
    return (
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Billing History</h2>
                    <p className="text-sm text-muted-foreground">
                        Export your payment records.
                    </p>
                </div>
                <div>
                    <Button
                        onClick={() => downloadPaymentsCsv(payments)}
                        disabled={!payments.length}
                        className="flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-card-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        <span>Export Payments</span>
                    </Button>
                </div>
            </div>
            <hr className="mb-1 mt-4 border-border" />
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Payment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Billing Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment.id} className="h-16">
                                <TableCell className="font-medium">
                                    <div className="flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Payment #{payment.id} -{" "}
                                        {new Date(
                                            payment.paymentDate
                                        ).toLocaleString("default", {
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                                            payment.paymentStatus === "Paid"
                                                ? "bg-green-100 text-green-800 border-green-300"
                                                : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                        }`}
                                    >
                                        {payment.paymentStatus === "Paid" ? (
                                            <Check className="w-4 h-4 inline-block mr-1" />
                                        ) : null}
                                        {payment.paymentStatus}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {new Date(
                                        payment.paymentDate
                                    ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    ${payment.amountPaid.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        onClick={() =>
                                            downloadPaymentRecord(payment)
                                        }
                                        className="flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 font-semibold text-card-foreground hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <ArrowDownToLineIcon className="w-4 h-4 mr-1" />
                                        Download Record
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {payments.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    No payment records yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default BillingHistory;
