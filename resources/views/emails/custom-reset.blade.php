<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Password - MediSync</title>
</head>
<body style="background-color: #F4F7F6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px 20px; margin: 0;">
    <div style="margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); max-width: 600px; border: 1px solid #E2E8F0;">
        
        <!-- Header Branding MediSync -->
        <div style="background-color: #1E2B27; padding: 35px 30px; text-align: center;">
            <h1 style="color: #69C98A; margin: 0; font-size: 28px; letter-spacing: 3px; font-weight: bold;">
                <span style="font-size: 24px; vertical-align: middle;">✚</span> MEDISYNC
            </h1>
            <p style="color: #A7BBB1; margin: 8px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
                Pharmacy Management System
            </p>
        </div>

        <!-- Konten Utama -->
        <div style="padding: 40px 35px; color: #1F2937;">
            <h2 style="margin-top: 0; font-size: 20px; color: #1F2937;">Halo!</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #64748B;">
                Anda menerima email ini karena kami mendapatkan permintaan untuk mengatur ulang kata sandi (*reset password*) untuk akun Anda di sistem MediSync.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{{ $url }}" style="background-color: #69C98A; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 15px;">
                    Atur Ulang Password
                </a>
            </div>
            
            <p style="font-size: 15px; line-height: 1.6; color: #64748B;">
                Tautan ini hanya berlaku selama <strong>60 menit</strong> ke depan demi alasan keamanan.<br><br>
                Jika Anda tidak pernah meminta pengaturan ulang kata sandi, tidak ada tindakan lebih lanjut yang perlu Anda lakukan. Abaikan email ini dan pastikan akun Anda tetap aman.
            </p>
            
            <p style="font-size: 15px; line-height: 1.6; color: #64748B; margin-top: 35px;">
                Salam Hormat,<br><strong style="color: #1F2937;">Tim IT & Keamanan MediSync</strong>
            </p>
        </div>

        <!-- Footer / Tautan Alternatif -->
        <div style="background-color: #F8FAFC; padding: 25px 35px; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: left; line-height: 1.6;">
            Jika Anda mengalami masalah saat mengklik tombol "Atur Ulang Password", salin dan tempel URL di bawah ini secara manual ke peramban web Anda:<br>
            <a href="{{ $url }}" style="color: #69C98A; word-break: break-all; margin-top: 10px; display: block;">{{ $url }}</a>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94A3B8;">
        © 2025 MediSync Enterprise. Dokumen Internal.
    </div>
</body>
</html>