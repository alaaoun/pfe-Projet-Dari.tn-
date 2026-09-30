import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '@/api/client';
import Button from './Button';
import styles from '@/pages/ListingPage.module.css';

const defaultMessages = [
  {
    role: 'assistant',
    text: 'Bonjour ! Je suis votre assistant de visite. Posez une question sur ce bien ou demandez une visite.',
  },
];

const QUICK_REPLIES = [
  'Donnez-moi plus de détails',
  'Est-ce disponible ?',
  'Planifier une visite',
  'Pourquoi ce prix ?',
];

function getAssistantReply(message, listing) {
  const normalized = message.toLowerCase();

  if (/prix|coût|tarif/.test(normalized)) {
    return `Le prix demandé est ${listing.price} ${listing.transaction === 'Location' ? 'DT/mois' : 'DT'}.`;
  }
  if (/surface|m²|superficie/.test(normalized)) {
    return listing.surface
      ? `La surface est de ${listing.surface} m².`
      : 'La surface n’est pas précisée dans l’annonce.';
  }
  if (/chambre|chambres|piece|pièces|pièce/.test(normalized)) {
    return `${listing.rooms || 'Ce bien'} dispose de ${listing.bedrooms || listing.rooms || 'plusieurs'} chambres.`;
  }
  if (/disponibl|disponible|statut/.test(normalized)) {
    return listing.status === 'active'
      ? 'Cette annonce est actuellement active et disponible.'
      : `Statut de l’annonce : ${listing.status}.`;
  }
  if (/visite|rendez-vous|planif|date/.test(normalized)) {
    return 'Vous pouvez demander une visite via le formulaire de visite dans la section de contact. Choisissez une date et ajoutez une note au propriétaire.';
  }
  if (/meublé|furni|mobill?é/.test(normalized)) {
    return listing.is_furnished ? 'Oui, le bien est meublé.' : 'Non, le bien n’est pas indiqué comme meublé.';
  }
  if (/quartier|ville|localisation|adresse/.test(normalized)) {
    return listing.governorate
      ? `Le bien est situé à ${listing.city}, ${listing.governorate}.`
      : `Le bien est situé à ${listing.city}.`;
  }

  return 'Je peux vous aider avec les détails du bien, la disponibilité ou la demande de visite. Que souhaitez-vous savoir ?';
}

export default function ChatAssistant({ listing }) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState(defaultMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const canSend = input.trim().length > 0 && !isSending;

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isSending) return;

    setIsSending(true);
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');

    try {
      const { data } = await client.post('/api/chatbot', { message: question, listing });
      const reply = data?.data?.reply || getAssistantReply(question, listing);
      setRecommendations(data?.data?.recommendations || []);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      const fallback = getAssistantReply(question, listing);
      setMessages((prev) => [...prev, { role: 'assistant', text: fallback }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = async (text) => {
    if (isSending) return;

    setIsSending(true);
    setMessages((prev) => [...prev, { role: 'user', text }]);

    try {
      const { data } = await client.post('/api/chatbot', { message: text, listing });
      const reply = data?.data?.reply || getAssistantReply(text, listing);
      setRecommendations(data?.data?.recommendations || []);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', text: getAssistantReply(text, listing) }]);
    } finally {
      setIsSending(false);
    }
  };

  const toggleOpen = () => setOpen((prev) => !prev);

  const unreadCount = useMemo(
    () => messages.filter((msg) => msg.role === 'assistant').length,
    [messages]
  );

  return (
    <div className={styles.chatWidget}>
      <button type="button" className={styles.chatToggle} onClick={toggleOpen}>
        Assistant de visite {open ? '−' : '+'}
      </button>

      {open && (
        <div className={styles.chatBox}>
          <div className={styles.chatBody}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={[styles.chatMessage, message.role === 'assistant' ? styles.chatAssistant : styles.chatUser].join(' ')}
              >
                <p>{message.text}</p>
              </div>
            ))}
          </div>

          {recommendations.length > 0 && (
            <div className={styles.chatRecommendations}>
              <strong>Vous pourriez aussi aimer</strong>
              {recommendations.map((recommendation) => (
                <Link
                  key={recommendation.id}
                  to={`/annonce/${recommendation.slug}`}
                  className={styles.chatRecommendation}
                >
                  <span>{recommendation.title}</span>
                  <small>{recommendation.price} DT · {recommendation.city}</small>
                </Link>
              ))}
            </div>
          )}

          <div className={styles.chatQuickReplies}>
            {QUICK_REPLIES.map((reply) => (
              <button key={reply} type="button" className={styles.chatQuickReply} onClick={() => handleQuickReply(reply)}>
                {reply}
              </button>
            ))}
          </div>

          <div className={styles.chatInputRow}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className={styles.chatInput}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button type="button" variant="primary" onClick={handleSend} disabled={!canSend} loading={isSending}>
              Envoyer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
