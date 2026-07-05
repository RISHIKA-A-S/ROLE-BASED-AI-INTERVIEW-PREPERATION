export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export const getInitials = (name) => {
    if (!name) return "";

    const words = name.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "";

    const first = words[0]?.[0] || "";
    const second = words.length > 1 ? (words[1]?.[0] || "") : "";

    return (first + second).toUpperCase();
};