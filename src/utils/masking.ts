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

export function maskIdNumber(idStr: string) {
    if (!idStr || idStr.length < 3) return idStr;
    return `*****${idStr.slice(-3)}`;
}

export function maskPayload(payloadStr: string) {
    if (!payloadStr) return payloadStr;
    try {
        const p = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;

        if (p.riderDetails) {
            if (p.riderDetails.email) p.riderDetails.email = maskEmail(p.riderDetails.email);
            if (p.riderDetails.phoneNumber) p.riderDetails.phoneNumber = maskPhone(p.riderDetails.phoneNumber);
            if (p.riderDetails.idNumber) p.riderDetails.idNumber = maskIdNumber(p.riderDetails.idNumber);
            if (p.riderDetails.emergencyPhone) p.riderDetails.emergencyPhone = maskPhone(p.riderDetails.emergencyPhone);
        }

        if (p.teamDetails && p.teamDetails.members) {
            p.teamDetails.members.forEach((m: any) => {
                if (m.email) m.email = maskEmail(m.email);
                if (m.phoneNumber) m.phoneNumber = maskPhone(m.phoneNumber);
                if (m.idNumber) m.idNumber = maskIdNumber(m.idNumber);
                if (m.emergencyPhone) m.emergencyPhone = maskPhone(m.emergencyPhone);
            });
        }

        if (p.familyDetails) {
            if (p.familyDetails.guardian) {
                if (p.familyDetails.guardian.email) p.familyDetails.guardian.email = maskEmail(p.familyDetails.guardian.email);
                if (p.familyDetails.guardian.phoneNumber) p.familyDetails.guardian.phoneNumber = maskPhone(p.familyDetails.guardian.phoneNumber);
                if (p.familyDetails.guardian.idNumber) p.familyDetails.guardian.idNumber = maskIdNumber(p.familyDetails.guardian.idNumber);
                if (p.familyDetails.guardian.emergencyPhone) p.familyDetails.guardian.emergencyPhone = maskPhone(p.familyDetails.guardian.emergencyPhone);
            }
            if (p.familyDetails.riders) {
                Object.values(p.familyDetails.riders).forEach((categoryGroup: any) => {
                    if (Array.isArray(categoryGroup)) {
                        categoryGroup.forEach((r: any) => {
                            if (r.idNumber) r.idNumber = maskIdNumber(r.idNumber);
                        });
                    }
                });
            }
        }
        return JSON.stringify(p);
    } catch (e) {
        return payloadStr;
    }
}

export function maskRegistration(reg: any) {
    if (!reg) return reg;
    return {
        ...reg,
        email: maskEmail(reg.email),
        phoneNumber: maskPhone(reg.phoneNumber),
        idNumber: maskIdNumber(reg.idNumber),
        emergencyPhone: maskPhone(reg.emergencyPhone),
        payload: maskPayload(reg.payload)
    };
}

export function maskRaffleTicket(ticket: any) {
    if (!ticket) return ticket;
    return {
        ...ticket,
        email: maskEmail(ticket.email),
        phoneNumber: maskPhone(ticket.phoneNumber),
        idNumber: maskIdNumber(ticket.idNumber)
    };
}
