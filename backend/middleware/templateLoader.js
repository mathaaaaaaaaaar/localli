import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const templateLoader = (templateName, placeholders) => {
    const templatePath = path.join(__dirname, '../emailTemplates', `${templateName}.html`);
    let template = fs.readFileSync(templatePath, 'utf8');
    // Replace placeholders in the template
    for (const [key, value] of Object.entries(placeholders)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, value);
    }

    return template;
}