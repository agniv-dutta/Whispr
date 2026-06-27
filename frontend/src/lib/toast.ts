import { toast } from "sonner";

export function toastSuccess(msg: string) {
  toast.success(msg, { duration: 3000 });
}

export function toastError(msg: string) {
  toast.error(msg, { duration: 4000 });
}

export function toastInfo(msg: string) {
  toast(msg, { duration: 3000 });
}
