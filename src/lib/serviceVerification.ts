export type ServiceVerificationLevel =
    | 'listed'
    | 'source_checked'
    | 'claimed'
    | 'credential_verified';

export const SERVICE_VERIFICATION_LABEL = 'بيانات مدققة';

export const SERVICE_VERIFICATION_EXPLANATION =
    'راجعت إدارة الدليل مصدر بيانات التواصل لهذا المزود. لا تعني الشارة ضمان جودة الخدمة أو اعتماداً مهنياً.';

export function serviceVerificationCopy(
    level?: string | null,
    legacyVerified?: boolean | null,
): { visible: boolean; label: string; explanation: string } {
    if (level === 'credential_verified') {
        return {
            visible: true,
            label: 'وثائق مهنية مدققة',
            explanation: 'راجعت إدارة الدليل وثيقة مهنية أو ترخيصاً ذا صلة. تحقّق من سريان الترخيص قبل التعاقد.',
        };
    }
    if (level === 'claimed') {
        return {
            visible: true,
            label: 'الصفحة مؤكدة من المزود',
            explanation: 'أكد مزود الخدمة ملكية هذه الصفحة وبيانات التواصل. لا تعني الشارة ضمان جودة الخدمة.',
        };
    }
    if (level === 'source_checked' || legacyVerified) {
        return {
            visible: true,
            label: SERVICE_VERIFICATION_LABEL,
            explanation: SERVICE_VERIFICATION_EXPLANATION,
        };
    }
    return {
        visible: false,
        label: 'مدرج',
        explanation: 'هذه البيانات مدرجة في الدليل ولم تحصل بعد على شارة تحقق.',
    };
}
