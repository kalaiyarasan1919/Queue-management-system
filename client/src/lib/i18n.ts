import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.appointments': 'My Appointments',
      'nav.services': 'Services',
      'nav.logout': 'Logout',
      
      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.add': 'Add',
      'common.confirm': 'Confirm',
      'common.close': 'Close',
      
      // Departments
      'dept.rto': 'RTO Services',
      'dept.income': 'Income Certificate',
      'dept.aadhar': 'Aadhar Services',
      'dept.municipal': 'Municipal Corporation',
      'dept.passport': 'Passport Office',
      
      // Services
      'service.dl_renewal': 'Driving License Renewal',
      'service.vehicle_registration': 'Vehicle Registration',
      'service.income_certificate': 'Income Certificate Application',
      'service.aadhar_update': 'Aadhar Update',
      'service.license_application': 'License Application',
      
      // Status
      'status.confirmed': 'Confirmed',
      'status.waiting': 'Waiting',
      'status.serving': 'Serving',
      'status.completed': 'Completed',
      'status.cancelled': 'Cancelled',
      'status.no_show': 'No Show',
      
      // Priority
      'priority.normal': 'General',
      'priority.senior': 'Senior Citizen',
      'priority.disabled': 'Differently Abled',
      'priority.emergency': 'Emergency',
      
      // Booking
      'booking.title': 'Book New Appointment',
      'booking.department': 'Department',
      'booking.service': 'Service Type',
      'booking.date': 'Preferred Date',
      'booking.time': 'Time Slot',
      'booking.priority': 'Priority Category',
      'booking.submit': 'Book Appointment',
      
      // Queue
      'queue.live_status': 'Live Queue Status',
      'queue.current': 'Current',
      'queue.in_queue': 'In Queue',
      'queue.est_wait': 'Est. Wait',
      'queue.next_token': 'Next Token',
      
      // Counter Status
      'counter.active': 'Active',
      'counter.busy': 'Busy',
      'counter.break': 'Break',
      'counter.offline': 'Offline',
      
      // Messages
      'msg.appointment_booked': 'Appointment booked successfully',
      'msg.appointment_cancelled': 'Appointment cancelled',
      'msg.unauthorized': 'You are logged out. Logging in again...',
      'msg.booking_failed': 'Failed to book appointment',
    }
  },
  hi: {
    translation: {
      // Navigation
      'nav.dashboard': 'डैशबोर्ड',
      'nav.appointments': 'मेरी अपॉइंटमेंट',
      'nav.services': 'सेवाएं',
      'nav.logout': 'लॉग आउट',
      
      // Common
      'common.loading': 'लोड हो रहा है...',
      'common.error': 'त्रुटि',
      'common.success': 'सफलता',
      'common.cancel': 'रद्द करें',
      'common.save': 'सेव करें',
      'common.edit': 'संपादित करें',
      'common.delete': 'हटाएं',
      'common.add': 'जोड़ें',
      'common.confirm': 'पुष्टि करें',
      'common.close': 'बंद करें',
      
      // Departments
      'dept.rto': 'आरटीओ सेवाएं',
      'dept.income': 'आय प्रमाण पत्र',
      'dept.aadhar': 'आधार सेवाएं',
      'dept.municipal': 'नगर निगम',
      'dept.passport': 'पासपोर्ट कार्यालय',
      
      // Services
      'service.dl_renewal': 'ड्राइविंग लाइसेंस नवीनीकरण',
      'service.vehicle_registration': 'वाहन पंजीकरण',
      'service.income_certificate': 'आय प्रमाण पत्र आवेदन',
      'service.aadhar_update': 'आधार अपडेट',
      'service.license_application': 'लाइसेंस आवेदन',
      
      // Status
      'status.confirmed': 'पुष्ट',
      'status.waiting': 'प्रतीक्षा में',
      'status.serving': 'सेवा में',
      'status.completed': 'पूर्ण',
      'status.cancelled': 'रद्द',
      'status.no_show': 'नहीं आया',
      
      // Priority
      'priority.normal': 'सामान्य',
      'priority.senior': 'वरिष्ठ नागरिक',
      'priority.disabled': 'दिव्यांग',
      'priority.emergency': 'आपातकाल',
      
      // Booking
      'booking.title': 'नई अपॉइंटमेंट बुक करें',
      'booking.department': 'विभाग',
      'booking.service': 'सेवा प्रकार',
      'booking.date': 'पसंदीदा दिनांक',
      'booking.time': 'समय स्लॉट',
      'booking.priority': 'प्राथमिकता श्रेणी',
      'booking.submit': 'अपॉइंटमेंट बुक करें',
      
      // Queue
      'queue.live_status': 'लाइव कतार स्थिति',
      'queue.current': 'वर्तमान',
      'queue.in_queue': 'कतार में',
      'queue.est_wait': 'अनुमानित प्रतीक्षा',
      'queue.next_token': 'अगला टोकन',
      
      // Counter Status
      'counter.active': 'सक्रिय',
      'counter.busy': 'व्यस्त',
      'counter.break': 'विराम',
      'counter.offline': 'ऑफलाइन',
      
      // Messages
      'msg.appointment_booked': 'अपॉइंटमेंट सफलतापूर्वक बुक हुई',
      'msg.appointment_cancelled': 'अपॉइंटमेंट रद्द',
      'msg.unauthorized': 'आप लॉग आउट हो गए हैं। फिर से लॉग इन हो रहे हैं...',
      'msg.booking_failed': 'अपॉइंटमेंट बुक करने में विफल',
    }
  },
  ta: {
    translation: {
      // Navigation
      'nav.dashboard': 'டாஷ்போர்டு',
      'nav.appointments': 'எனது அப்பாயிண்ட்மெண்ட்கள்',
      'nav.services': 'சேவைகள்',
      'nav.logout': 'வெளியேறு',
      
      // Common
      'common.loading': 'ஏற்றுகிறது...',
      'common.error': 'பிழை',
      'common.success': 'வெற்றி',
      'common.cancel': 'ரத்து செய்',
      'common.save': 'சேமி',
      'common.edit': 'திருத்து',
      'common.delete': 'நீக்கு',
      'common.add': 'சேர்',
      'common.confirm': 'உறுதிப்படுத்து',
      'common.close': 'மூடு',
      
      // Departments
      'dept.rto': 'ஆர்டிஓ சேவைகள்',
      'dept.income': 'வருமான சான்றிதழ்',
      'dept.aadhar': 'ஆதார் சேவைகள்',
      'dept.municipal': 'நகராட்சி கழகம்',
      'dept.passport': 'பாஸ்போர்ட் அலுவலகம்',
      
      // Services
      'service.dl_renewal': 'ஓட்டுநர் உரிமம் புதுப்பித்தல்',
      'service.vehicle_registration': 'வாகன பதிவு',
      'service.income_certificate': 'வருமான சான்றிதழ் விண்ணப்பம்',
      'service.aadhar_update': 'ஆதார் புதுப்பிப்பு',
      'service.license_application': 'உரிமம் விண்ணப்பம்',
      
      // Status
      'status.confirmed': 'உறுதிப்படுத்தப்பட்டது',
      'status.waiting': 'காத்திருக்கிறது',
      'status.serving': 'சேவையில்',
      'status.completed': 'முடிவுற்றது',
      'status.cancelled': 'ரத்து செய்யப்பட்டது',
      'status.no_show': 'வரவில்லை',
      
      // Priority
      'priority.normal': 'பொது',
      'priority.senior': 'மூத்த குடிமகன்',
      'priority.disabled': 'மாற்றுத்திறனாளி',
      'priority.emergency': 'அவசரம்',
      
      // Booking
      'booking.title': 'புதிய அப்பாயிண்ட்மெண்ட் பதிவு செய்',
      'booking.department': 'துறை',
      'booking.service': 'சேவை வகை',
      'booking.date': 'விருப்பமான தேதி',
      'booking.time': 'நேர இடைவெளி',
      'booking.priority': 'முன்னுரிமை வகை',
      'booking.submit': 'அப்பாயிண்ட்மெண்ட் பதிவு செய்',
      
      // Queue
      'queue.live_status': 'நேரடி வரிசை நிலை',
      'queue.current': 'தற்போதைய',
      'queue.in_queue': 'வரிசையில்',
      'queue.est_wait': 'மதிப்பிடப்பட்ட காத்திருப்பு',
      'queue.next_token': 'அடுத்த டோக்கன்',
      
      // Counter Status
      'counter.active': 'செயலில்',
      'counter.busy': 'பணியில்',
      'counter.break': 'இடைவேளை',
      'counter.offline': 'ஆஃப்லைன்',
      
      // Messages
      'msg.appointment_booked': 'அப்பாயிண்ட்மெண்ட் வெற்றிகரமாக பதிவு செய்யப்பட்டது',
      'msg.appointment_cancelled': 'அப்பாயிண்ட்மெண்ட் ரத்து செய்யப்பட்டது',
      'msg.unauthorized': 'நீங்கள் வெளியேறிவிட்டீர்கள். மீண்டும் உள்நுழைகிறது...',
      'msg.booking_failed': 'அப்பாயிண்ட்மெண்ட் பதிவு செய்ய முடியவில்லை',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
