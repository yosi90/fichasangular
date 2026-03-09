export const DEFAULT_PROFILE_GUY_AVATAR = 'assets/img/defaultGuy.png';
export const DEFAULT_PROFILE_GIRL_AVATAR = 'assets/img/defaultGirl.png';

export function resolveDefaultProfileAvatar(seed: string | null | undefined): string {
    const normalized = `${seed ?? ''}`.trim().toLowerCase();
    if (normalized.length < 1)
        return DEFAULT_PROFILE_GUY_AVATAR;

    let total = 0;
    for (const char of normalized)
        total += char.charCodeAt(0);

    return total % 2 === 0
        ? DEFAULT_PROFILE_GIRL_AVATAR
        : DEFAULT_PROFILE_GUY_AVATAR;
}
