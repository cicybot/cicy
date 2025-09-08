let TOKEN: null | string = null;

export const getToken = () => {
    return TOKEN;
};

export const setToken = (token: null | string) => {
    TOKEN = token;
};
