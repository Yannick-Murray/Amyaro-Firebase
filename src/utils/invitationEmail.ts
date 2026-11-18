const INVITATIONS_PATH = '/invitations';
const DEFAULT_VALIDITY_DAYS = 7;

const singleLine = (value: string): string =>
  value.replace(/[\r\n]+/g, ' ').trim();

const getAppOrigin = (appUrl?: string): string => {
  const configuredUrl = appUrl ?? import.meta.env.VITE_APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return '';
};

export interface InvitationEmailInput {
  toEmail: string;
  listName: string;
  inviterName: string;
  appUrl?: string;
  validityDays?: number;
}

export interface InvitationEmailContent {
  subject: string;
  body: string;
  mailtoHref: string;
}

/**
 * Baut die vorbereitete E-Mail für die clientseitige mailto-Variante.
 * Der Versand erfolgt immer aus dem E-Mail-Programm des Absenders.
 */
export const buildInvitationEmail = ({
  toEmail,
  listName,
  inviterName,
  appUrl,
  validityDays = DEFAULT_VALIDITY_DAYS,
}: InvitationEmailInput): InvitationEmailContent => {
  const safeListName = singleLine(listName) || 'deine Liste';
  const safeInviterName = singleLine(inviterName) || 'Jemand';
  const invitationUrl = `${getAppOrigin(appUrl)}${INVITATIONS_PATH}`;
  const validityText =
    validityDays === 1 ? '1 Tag gültig' : `${validityDays} Tage gültig`;

  const subject = `${safeInviterName} möchte die Liste „${safeListName}“ mit dir teilen`;

  const body = [
    'Hallo,',
    '',
    `${safeInviterName} möchte über Amyaro die Liste „${safeListName}“ mit dir teilen.`,
    '',
    'So nimmst du die Einladung an:',
    `1. Öffne diesen Link: ${invitationUrl}`,
    '2. Melde dich mit dieser E-Mail-Adresse an oder registriere dich damit.',
    '3. Bestätige gegebenenfalls deine E-Mail-Adresse.',
    '4. Die Einladung erscheint direkt – klicke dort auf „Annehmen“.',
    '',
    `Die Einladung ist an diese E-Mail-Adresse gebunden und ${validityText}.`,
    '',
    'Wenn du die Einladung nicht erwartest, kannst du diese E-Mail ignorieren.',
    '',
    'Viele Grüße',
    safeInviterName,
    '',
    '--',
    'Amyaro – Gemeinsame Einkaufs- und Geschenkelisten',
  ].join('\n');

  const mailtoHref = `mailto:${encodeURIComponent(toEmail.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoHref };
};

export const buildInvitationCopyText = (
  content: InvitationEmailContent
): string => `Betreff: ${content.subject}\n\n${content.body}`;

export type WebmailProvider = 'gmail' | 'outlook';

/**
 * Baut einen Link zum Webmail-Editor des Anbieters. Der Versand erfolgt aus
 * dem im Browser angemeldeten Konto des Absenders – ohne Passwort oder SMTP.
 */
export const buildWebmailComposeUrl = (
  provider: WebmailProvider,
  content: InvitationEmailContent,
  toEmail: string
): string => {
  const recipient = encodeURIComponent(toEmail.trim());
  const subject = encodeURIComponent(content.subject);
  const body = encodeURIComponent(content.body);

  if (provider === 'gmail') {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${recipient}&su=${subject}&body=${body}`;
  }

  return `https://outlook.live.com/mail/0/deeplink/compose?to=${recipient}&subject=${subject}&body=${body}`;
};
