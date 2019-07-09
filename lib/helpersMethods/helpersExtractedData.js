exports.extractedBodyData = data => {
    const extractFields = {
        firstName: false,
        lastName: false,
        password: false,
        phone: false
    };
    for (const extractFieldsKey in extractFields) {
        const property = data.payload[extractFieldsKey];
        if (property) {
            const length = property.trim().length;
            if (extractFieldsKey.toString() === 'phone' && length === 10) {
                extractFields.phone = property.trim();
            }
            if (typeof (property === 'string' && length > 0)) {
                extractFields[extractFieldsKey] = property.trim();
            }
        }
    }
    return extractFields;
};

const validDataFunc = (data, property, queryObject) => {
    if (queryObject === 'queryStringObject') {
        return data.queryStringObject.get(property)
    } else {
        return data.payload[property]
    }
};

exports.dataValidationUsers = (data, property, queryObject) => {
    const compareLength = property === 'phone' ? 10 : 20;
    const validData = validDataFunc(data, property, queryObject);
    return typeof validData === 'string' && validData.trim().length === compareLength ? validData.trim() : false;
};

exports.dataValidationChecks = (data, property, queryObject, arrayValidation) => {
    const validData = validDataFunc(data, property, queryObject);
    return typeof validData === 'string' && arrayValidation.indexOf(validData) > -1 ? validData : false;
};

exports.dataValidationSuccessCodes = (data, property, queryObject) => {
    const validData = validDataFunc(data, property, queryObject);
    return validData instanceof Array && validData.length > 0 ? validData : false
};

exports.dataValidationTimeout = (data, property, queryObject) => {
    const validData = validDataFunc(data, property, queryObject);
    return typeof validData === 'number' && validData % 1 === 0 && validData >= 1 && validData <= 5 ? validData : false
};

exports.dataValidationUrl = (data, property, queryObject) => {
    const validData = validDataFunc(data, property, queryObject);
    return typeof validData === 'string' && validData.trim().length > 0 ? validData.trim() : false;
};
