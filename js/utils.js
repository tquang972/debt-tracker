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

export const getRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Overdue';
    return `In ${diffDays} days`;
};

export const isThisWeek = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return date >= today && date <= nextWeek;
};

export const isThisMonth = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};
