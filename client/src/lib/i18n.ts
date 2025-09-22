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
      
      // Login Page
      'login.title': 'eQueue 2.0',
      'login.subtitle': 'Digital Queue Management System',
      'login.description': 'Government Services Portal',
      'login.feature1': 'Book appointments online',
      'login.feature2': 'Priority queue for senior citizens',
      'login.feature3': 'Multi-language support',
      'login.departments': 'Supporting Government Departments:',
      'login.tab_login': 'Login',
      'login.tab_register': 'Register',
      'login.google_login': 'Login with Google',
      'login.replit_login': 'Login with Replit',
      'login.email': 'Email',
      'login.password': 'Password',
      'login.show_password': 'Show password',
      'login.hide_password': 'Hide password',
      'login.login_button': 'Login',
      'login.register_button': 'Register',
      'login.first_name': 'First Name',
      'login.last_name': 'Last Name',
      'login.confirm_password': 'Confirm Password',
      'login.upload_certificate': 'Upload PwD Certificate (Optional)',
      'login.upload_age_proof': 'Upload Age Proof (For Senior Citizens)',
      'login.terms': 'I agree to the terms and conditions',
      'login.login_success': 'Login Successful',
      'login.login_success_desc': 'Welcome back!',
      'login.register_success': 'Registration Successful',
      'login.register_success_desc': 'Account created successfully! You can now login.',
      'login.login_failed': 'Login failed',
      'login.register_failed': 'Registration failed',
      'login.validation.email_required': 'Email is required',
      'login.validation.password_required': 'Password is required',
      'login.validation.first_name_required': 'First name is required',
      'login.validation.last_name_required': 'Last name is required',
      'login.validation.confirm_password_required': 'Please confirm your password',
      'login.validation.email_invalid': 'Please enter a valid email address',
      'login.validation.password_weak': 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      'login.validation.password_mismatch': 'Passwords do not match',
      'login.validation.terms_required': 'Please accept the terms and conditions',
      
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
      
      // Login Page
      'login.title': 'ई-क्यू 2.0',
      'login.subtitle': 'डिजिटल कतार प्रबंधन प्रणाली',
      'login.description': 'सरकारी सेवा पोर्टल',
      'login.feature1': 'ऑनलाइन अपॉइंटमेंट बुक करें',
      'login.feature2': 'वरिष्ठ नागरिकों के लिए प्राथमिकता कतार',
      'login.feature3': 'बहुभाषी सहायता',
      'login.departments': 'समर्थित सरकारी विभाग:',
      'login.tab_login': 'लॉग इन',
      'login.tab_register': 'पंजीकरण',
      'login.google_login': 'गूगल से लॉग इन करें',
      'login.replit_login': 'रिप्लिट से लॉग इन करें',
      'login.email': 'ईमेल',
      'login.password': 'पासवर्ड',
      'login.show_password': 'पासवर्ड दिखाएं',
      'login.hide_password': 'पासवर्ड छुपाएं',
      'login.login_button': 'लॉग इन',
      'login.register_button': 'पंजीकरण',
      'login.first_name': 'पहला नाम',
      'login.last_name': 'अंतिम नाम',
      'login.confirm_password': 'पासवर्ड की पुष्टि करें',
      'login.upload_certificate': 'दिव्यांग प्रमाणपत्र अपलोड करें (वैकल्पिक)',
      'login.upload_age_proof': 'आयु प्रमाण अपलोड करें (वरिष्ठ नागरिकों के लिए)',
      'login.terms': 'मैं नियम और शर्तों से सहमत हूं',
      'login.login_success': 'लॉग इन सफल',
      'login.login_success_desc': 'वापस स्वागत है!',
      'login.register_success': 'पंजीकरण सफल',
      'login.register_success_desc': 'खाता सफलतापूर्वक बनाया गया! अब आप लॉग इन कर सकते हैं।',
      'login.login_failed': 'लॉग इन विफल',
      'login.register_failed': 'पंजीकरण विफल',
      'login.validation.email_required': 'ईमेल आवश्यक है',
      'login.validation.password_required': 'पासवर्ड आवश्यक है',
      'login.validation.first_name_required': 'पहला नाम आवश्यक है',
      'login.validation.last_name_required': 'अंतिम नाम आवश्यक है',
      'login.validation.confirm_password_required': 'कृपया अपने पासवर्ड की पुष्टि करें',
      'login.validation.email_invalid': 'कृपया एक वैध ईमेल पता दर्ज करें',
      'login.validation.password_weak': 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए जिसमें बड़े अक्षर, छोटे अक्षर, संख्या और विशेष अक्षर हों',
      'login.validation.password_mismatch': 'पासवर्ड मेल नहीं खाते',
      'login.validation.terms_required': 'कृपया नियम और शर्तों को स्वीकार करें',
      
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
      
      // Login Page
      'login.title': 'இ-கியூ 2.0',
      'login.subtitle': 'டிஜிட்டல் வரிசை மேலாண்மை அமைப்பு',
      'login.description': 'அரசு சேவை போர்டல்',
      'login.feature1': 'ஆன்லைனில் அப்பாயிண்ட்மெண்ட் பதிவு செய்யுங்கள்',
      'login.feature2': 'மூத்த குடிமக்களுக்கான முன்னுரிமை வரிசை',
      'login.feature3': 'பல மொழி ஆதரவு',
      'login.departments': 'ஆதரிக்கும் அரசு துறைகள்:',
      'login.tab_login': 'உள்நுழை',
      'login.tab_register': 'பதிவு',
      'login.google_login': 'கூகிள் மூலம் உள்நுழையுங்கள்',
      'login.replit_login': 'ரெப்லிட் மூலம் உள்நுழையுங்கள்',
      'login.email': 'மின்னஞ்சல்',
      'login.password': 'கடவுச்சொல்',
      'login.show_password': 'கடவுச்சொல்லைக் காட்டு',
      'login.hide_password': 'கடவுச்சொல்லை மறை',
      'login.login_button': 'உள்நுழை',
      'login.register_button': 'பதிவு',
      'login.first_name': 'முதல் பெயர்',
      'login.last_name': 'கடைசி பெயர்',
      'login.confirm_password': 'கடவுச்சொல்லை உறுதிப்படுத்துங்கள்',
      'login.upload_certificate': 'மாற்றுத்திறனாளி சான்றிதழை பதிவேற்றுங்கள் (விருப்பமானது)',
      'login.upload_age_proof': 'வயது சான்றை பதிவேற்றுங்கள் (மூத்த குடிமக்களுக்கு)',
      'login.terms': 'நான் விதிமுறைகள் மற்றும் நிபந்தனைகளுக்கு ஒப்புக்கொள்கிறேன்',
      'login.login_success': 'உள்நுழைவு வெற்றி',
      'login.login_success_desc': 'மீண்டும் வரவேற்கிறோம்!',
      'login.register_success': 'பதிவு வெற்றி',
      'login.register_success_desc': 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! இப்போது நீங்கள் உள்நுழையலாம்.',
      'login.login_failed': 'உள்நுழைவு தோல்வி',
      'login.register_failed': 'பதிவு தோல்வி',
      'login.validation.email_required': 'மின்னஞ்சல் தேவை',
      'login.validation.password_required': 'கடவுச்சொல் தேவை',
      'login.validation.first_name_required': 'முதல் பெயர் தேவை',
      'login.validation.last_name_required': 'கடைசி பெயர் தேவை',
      'login.validation.confirm_password_required': 'உங்கள் கடவுச்சொல்லை உறுதிப்படுத்துங்கள்',
      'login.validation.email_invalid': 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடுங்கள்',
      'login.validation.password_weak': 'கடவுச்சொல் குறைந்தது 8 எழுத்துகளாக இருக்க வேண்டும், பெரிய எழுத்து, சிறிய எழுத்து, எண் மற்றும் சிறப்பு எழுத்து உள்ளடங்கியது',
      'login.validation.password_mismatch': 'கடவுச்சொற்கள் பொருந்தவில்லை',
      'login.validation.terms_required': 'விதிமுறைகள் மற்றும் நிபந்தனைகளை ஏற்கவும்',
      
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
