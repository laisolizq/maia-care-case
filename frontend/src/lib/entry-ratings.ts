export type RatingField = 'wellbeing' | 'sleep' | 'energy' | 'stress';

export const ratingFields: {
  key: RatingField;
  label: string;
  icons: string[];
  descriptions: string[];
  inverted?: boolean;
}[] = [
  {
    key: 'wellbeing',
    label: '¿Cómo te encuentras?',
    icons: ['😣', '🙁', '😐', '🙂', '😄'],
    descriptions: ['Muy mal', 'Mal', 'Normal', 'Bien', 'Muy bien'],
  },
  {
    key: 'sleep',
    label: '¿Cómo has dormido?',
    icons: ['🥱', '😴', '🌙', '💤', '🛌'],
    descriptions: ['Muy mal', 'Mal', 'Normal', 'Bien', 'Muy bien'],
  },
  {
    key: 'energy',
    label: '¿Cuánta energía tienes?',
    icons: ['🪫', '⚡', '⚡⚡', '⚡⚡⚡', '🔋'],
    descriptions: ['Ninguna', 'Poca', 'Normal', 'Bastante', 'Mucha'],
  },
  {
    key: 'stress',
    label: '¿Cuánto estrés has sentido?',
    icons: ['😫', '😟', '😐', '🙂', '😌'],
    descriptions: ['Mucho', 'Bastante', 'Normal', 'Poco', 'Nada'],
    inverted: true,
  },
];

export const ratingColors = [
  'bg-red-100 border-red-400',
  'bg-orange-100 border-orange-400',
  'bg-yellow-100 border-yellow-400',
  'bg-lime-100 border-lime-400',
  'bg-green-100 border-green-500',
];

// Convierte el valor guardado en la posición visual correspondiente.
export function getRatingIndex(field: RatingField, value: number): number {
  const config = ratingFields.find((item) => item.key === field);

  return config?.inverted ? 5 - value : value - 1;
}
