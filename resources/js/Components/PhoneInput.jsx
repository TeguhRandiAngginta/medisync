import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function CustomPhoneInput({ value, onChange, placeholder = "Contoh: 812-3456-7890" }) {
    
    const formatInitialValue = (val) => {
        if (!val) return '';
        if (val.startsWith('0')) {
            return '+62' + val.substring(1);
        }
        return val;
    };

    return (
        <div className="relative w-full medisync-phone-input">
            <PhoneInput
                international
                defaultCountry="ID"
                value={formatInitialValue(value)}
                onChange={onChange}
                placeholder={placeholder}
                className="flex items-center w-full"
                numberInputProps={{
                    className: "w-full px-4 py-3 bg-gray-50 dark:bg-[#151E24] border-transparent rounded-xl focus:bg-white dark:focus:bg-[#212E36] focus:border-[#48CFA4] focus:ring-2 focus:ring-[#48CFA4]/20 text-gray-900 dark:text-gray-100 transition-colors outline-none ml-2 text-sm font-medium"
                }}
            />

            <style>{`
                .medisync-phone-input .PhoneInput {
                    display: flex;
                    align-items: center;
                    width: 100%;
                }

                /* Tombol Bendera yang Sangat Elegan */
                .medisync-phone-input .PhoneInputCountry {
                    display: flex;
                    align-items: center;
                    background-color: #F8FAFC;
                    padding: 0.6rem 0.85rem;
                    border-radius: 0.75rem;
                    border: 1px solid #E2E8F0;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .dark .medisync-phone-input .PhoneInputCountry {
                    background-color: #151E24;
                    border-color: #2D3748;
                }

                .medisync-phone-input .PhoneInputCountry:hover {
                    border-color: #48CFA4;
                    background-color: #EAF5F0;
                }

                .dark .medisync-phone-input .PhoneInputCountry:hover {
                    background-color: #253939;
                }

                /* Bendera Ukuran Ideal */
                .medisync-phone-input .PhoneInputCountryIcon {
                    width: 28px;
                    height: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
                    border-radius: 4px;
                    overflow: hidden;
                }

                /* Panah Dropdown Kustom */
                .medisync-phone-input .PhoneInputCountrySelectArrow {
                    display: block;
                    content: "";
                    width: 6px;
                    height: 6px;
                    border-bottom: 2px solid #64748B;
                    border-right: 2px solid #64748B;
                    transform: rotate(45deg);
                    margin-left: 8px;
                }

                .dark .medisync-phone-input .PhoneInputCountrySelectArrow {
                    border-color: #94A3B8;
                }

                /* Menu Pilihan Negara (Dropdown) yang Sangat Rapi */
                .medisync-phone-input .PhoneInputCountrySelect {
                    background-color: #FFFFFF !important;
                    color: #1E293B !important;
                    border: 1px solid #E2E8F0 !important;
                    border-radius: 1rem !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
                    padding: 0.75rem !important;
                    max-height: 260px !important;
                    overflow-y: auto !important;
                    margin-top: 8px !important;
                }

                .dark .medisync-phone-input .PhoneInputCountrySelect {
                    background-color: #1E272E !important;
                    color: #F1F5F9 !important;
                    border-color: #2D3748 !important;
                }

                /* Efek saat opsi negara disorot */
                .medisync-phone-input .PhoneInputCountrySelect option {
                    padding: 10px 14px;
                    border-radius: 0.5rem;
                }
            `}</style>
        </div>
    );
}