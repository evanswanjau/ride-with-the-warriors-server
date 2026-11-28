export function maskEmail(email: string) {
    if (!email) return email;
    const [name, domain] = email.split('@');
    if (!domain) return email;
    return `${name.charAt(0)}****@${domain}`;
}

export function maskPhone(phone: string) {
    if (!phone || phone.length < 4) return phone;
    return `*****${phone.slice(-3)}`;
}
