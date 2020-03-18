/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PropertyGroup, Property, PropertyGroupContainer } from '../../interfaces/content-metadata.interfaces';

const emptyGroup = {
    properties: {}
};

function convertObjectToArray(object: any): Property[] {
    return Object.keys(object).map((key) => object[key]);
}

export function getGroup(propertyGroups: PropertyGroupContainer, groupName: string): PropertyGroup | undefined {
    return propertyGroups[groupName];
}

export function getProperty(propertyGroups: PropertyGroupContainer, groupName: string, propertyName: string): Property | Property[] | undefined {
    const groupDefinition = getGroup(propertyGroups, groupName) || emptyGroup;
    let propertyDefinitions;

    if (propertyName === '*') {
        propertyDefinitions = convertObjectToArray(groupDefinition.properties);
    } else {
        propertyDefinitions = groupDefinition.properties[propertyName];
    }

    return propertyDefinitions;
}

export function setPropertyTitle(item: Property | Property[], property: Property): Property | Property[] {
    let properties;
    if (item instanceof Array) {
        properties =  [ ...item ];
        const filteredProperty = properties.find((_item) => _item.name === property.name);
        if (filteredProperty && !!property.title) { filteredProperty.title = property.title; }
    } else if (item) {
        properties = { ...item, ...(item.name === property.name && !!property.title) && { title: property.title } };
    }
    return properties;
}
