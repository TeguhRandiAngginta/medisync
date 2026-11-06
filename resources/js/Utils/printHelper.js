export const printReceipt = (htmlContent) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Cetak Struk Transaksi</title>
                <style>
                    body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
                    .text-center { text-align: center; }
                    .bold { font-weight: bold; }
                    @page { size: auto; margin: 0mm; }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
        </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    
    setTimeout(() => {
        iframe.contentWindow.print();
        
        // Listener event setelah dialog cetak ditutup
        iframe.contentWindow.onafterprint = () => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        };

        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 2000);
    }, 250);
};