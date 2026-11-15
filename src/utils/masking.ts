type MaskablePerson = { email?: string; phoneNumber?: string; idNumber?: string; emergencyPhone?: string };
type MaskablePayload = {
    riderDetails?: MaskablePerson;
    teamDetails?: { members?: MaskablePerson[] };
    familyDetails?: { guardian?: MaskablePerson; riders?: Record<string, MaskablePerson[] | undefined> };
};
type MaskableRegistration = {
    email?: string | null; phoneNumber?: string | null; idNumber?: string | null; emergencyPhone?: string | null; payload?: unknown;
};

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
        const p: MaskablePayload = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;

        if (p.riderDetails) {
            if (p.riderDetails.email) p.riderDetails.email = maskEmail(p.riderDetails.email);
            if (p.riderDetails.phoneNumber) p.riderDetails.phoneNumber = maskPhone(p.riderDetails.phoneNumber);
            if (p.riderDetails.idNumber) p.riderDetails.idNumber = maskIdNumber(p.riderDetails.idNumber);
            if (p.riderDetails.emergencyPhone) p.riderDetails.emergencyPhone = maskPhone(p.riderDetails.emergencyPhone);
        }

        if (p.teamDetails && p.teamDetails.members) {
            p.teamDetails.members.forEach((m) => {
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
                Object.values(p.familyDetails.riders).forEach((categoryGroup) => {
                    if (Array.isArray(categoryGroup)) {
                        categoryGroup.forEach((r) => {
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

export function maskRegistration<T extends MaskableRegistration>(reg: T | null | undefined) {
    if (!reg) return reg;
    return {
        ...reg,
        email: maskEmail(reg.email as string),
        phoneNumber: maskPhone(reg.phoneNumber as string),
        idNumber: maskIdNumber(reg.idNumber as string),
        emergencyPhone: maskPhone(reg.emergencyPhone as string),
        payload: maskPayload(reg.payload as string)
    };
}

export function maskRaffleTicket<T extends { email?: string | null; phoneNumber?: string | null; idNumber?: string | null }>(ticket: T | null | undefined) {
    if (!ticket) return ticket;
    return {
        ...ticket,
        email: maskEmail(ticket.email as string),
        phoneNumber: maskPhone(ticket.phoneNumber as string),
        idNumber: maskIdNumber(ticket.idNumber as string)
    };
}
