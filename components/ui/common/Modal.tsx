import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { Text } from "@/components/retroui/Text";
import { ReactNode } from "react";

type ModalProps = {
  header: string;
  children: ReactNode;
  footer?: string;
};

export default function Modal({ children, header, footer }: ModalProps) {
  return (
    <Dialog.Content size={"sm"}>
      <Dialog.Header>
        <Text as="h5">{header}</Text>
      </Dialog.Header>
      <section className="flex flex-col gap-4 p-4">
        {/* <section className="text-xl">
            <p>Are you sure you want to delete this item?</p>
            <p>This action cannout be undone.</p>
          </section> */}

        {children}
        {footer && (
          <section className="flex w-full justify-end">
            <Dialog.Trigger asChild>
              <Button>{footer}</Button>
            </Dialog.Trigger>
          </section>
        )}
      </section>
    </Dialog.Content>
  );
}
