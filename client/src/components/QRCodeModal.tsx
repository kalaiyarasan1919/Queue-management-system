import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenNumber: string;
  qrCode: string;
}

export function QRCodeModal({ isOpen, onClose, tokenNumber, qrCode }: QRCodeModalProps) {
  const { t } = useLanguage();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen && qrCode) {
      QRCode.toDataURL(qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).then((url: string) => {
        setQrCodeDataUrl(url);
      });
    }
  }, [isOpen, qrCode]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="qr-modal">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t('common.token')} {tokenNumber} QR Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center">
          <div className="bg-muted p-8 rounded-lg mb-4 flex items-center justify-center">
            {qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt={`QR Code for token ${tokenNumber}`}
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Generating QR Code...</p>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Show this QR code at the counter for verification
          </p>
          
          <Button onClick={onClose} data-testid="button-close-qr">
            {t('common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
