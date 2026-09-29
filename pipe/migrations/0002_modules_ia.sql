-- Modules IA (chatbot, accueil vocal): one active tier per module, alongside web + cellulaire.
ALTER TABLE customers ADD COLUMN forfait_chatbot TEXT;
ALTER TABLE customers ADD COLUMN forfait_vocal TEXT;
