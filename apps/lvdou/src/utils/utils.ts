export function validateChinaMobile(phoneNumber: string) {
    if (!/^1\d{10}$/.test(phoneNumber)) {
        return false;
    }

    const secondDigit = phoneNumber.substring(1, 2);
    const firstThreeDigits = phoneNumber.substring(0, 3);

    if (
        ['3', '9'].includes(secondDigit) ||
        ['4', '7', '8'].includes(secondDigit) ||
        ['5', '6'].includes(secondDigit)
    ) {
    } else {
        return false;
    }

    // Specific number range validation
    const validPrefixes = [
        // China Mobile
        '134',
        '135',
        '136',
        '137',
        '138',
        '139',
        '150',
        '151',
        '152',
        '157',
        '158',
        '159',
        '172',
        '178',
        '182',
        '183',
        '184',
        '187',
        '188',
        '195',
        '197',
        '198',

        // China Unicom
        '130',
        '131',
        '132',
        '155',
        '156',
        '166',
        '175',
        '176',
        '185',
        '186',
        '145',
        '146',

        // China Telecom
        '133',
        '153',
        '173',
        '177',
        '180',
        '181',
        '189',
        '190',
        '191',
        '193',
        '199'
    ];

    return validPrefixes.includes(firstThreeDigits);
}

export function isAndroid() {
    return !!getAndroidApi();
}

export function getAndroidApi() {
    //@ts-ignore
    const { __AndroidAPI } = window;
    return __AndroidAPI;
}

export function formatDateTime(timestamp: number) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export function maskUserName(username: string) {
    return `${username.substring(0, 3)}*****${username.substring(username.length - 3)}`;
}
