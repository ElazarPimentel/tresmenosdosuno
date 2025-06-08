interface Professional {
  name: string;
  profession: string;
  location: string;
  contact: string;
  province: string;
  type: string;
}

interface ProfessionalCardProps {
  professional: Professional;
}

export default function ProfessionalCard({ professional }: ProfessionalCardProps) {
  return (
    <div className="professional-card">
      <h3 className="professional-card__name">{professional.name}</h3>
      <p className="professional-card__profession">{professional.profession}</p>
      <p className="professional-card__location">{professional.location}</p>
      <p className="professional-card__province">{professional.province}</p>
      <p className="professional-card__type">{professional.type}</p>
      <a 
        href={`mailto:${professional.contact}`}
        className="professional-card__contact"
      >
        Contactar
      </a>
    </div>
  );
} 