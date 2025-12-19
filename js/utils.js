export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Parse YYYY-MM-DD manually to avoid timezone issues
    const [year, month, day] = dateStr.split('-');
    return `${parseInt(month)}/${parseInt(day)}/${year}`;
};

// Helper to parse YYYY-MM-DD as local date
export const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const getRelativeDate = (dateString) => {
    if (!dateString) return '';
    // Use parseLocalDate to avoid timezone offset
    const date = parseLocalDate(dateString);
    const today = new Date();
    // Normalize today to start of day for comparison
    today.setHours(0, 0, 0, 0);

    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Overdue';
    return `In ${diffDays} days`;
};

export const isThisWeek = (dateString) => {
    const date = parseLocalDate(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return date >= today && date <= nextWeek;
};

export const isThisMonth = (dateString) => {
    const date = parseLocalDate(dateString);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};
