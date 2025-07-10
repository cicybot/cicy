// src/utils/yamlHelper.ts
import yaml from 'js-yaml';

export class YamlHelper {
    /**
     * Parse YAML string to JavaScript object
     */
    static parse<T = any>(yamlString: string): T {
        return yaml.load(yamlString) as T;
    }

    /**
     * Convert JavaScript object to YAML string
     */
    static stringify(data: object): string {
        return yaml.dump(data);
    }

    /**
     * Read and parse YAML file
     */
    static async readYamlFile<T = any>(filePath: string): Promise<T> {
        const response = await fetch(filePath);
        const yamlText = await response.text();
        return this.parse<T>(yamlText);
    }
}
