export function stringifyQuery(query) {
    const params = new URLSearchParams();
    appendValue(params, undefined, query);
    return params.toString();
}
function appendValue(params, key, value) {
    if (value === undefined) {
        return;
    }
    if (value === null) {
        if (key)
            params.append(key, '');
        return;
    }
    if (value instanceof Date) {
        if (key)
            params.append(key, value.toISOString());
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((item, index) => appendValue(params, key ? `${key}[${index}]` : `${index}`, item));
        return;
    }
    if (typeof value === 'object') {
        Object.entries(value).forEach(([childKey, childValue]) => {
            appendValue(params, key ? `${key}[${childKey}]` : childKey, childValue);
        });
        return;
    }
    if (key) {
        params.append(key, String(value));
    }
}
//# sourceMappingURL=query-string.js.map