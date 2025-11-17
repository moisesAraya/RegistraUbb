import React from 'react';
import { useProfileImage } from '../../hooks/useProfileImage';

interface UserAvatarProps {
  nombres?: string;
  apellidos?: string;
  rut_usuario?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-32 h-32 text-5xl'
};

const borderClasses = {
  sm: 'border-2',
  md: 'border-2',
  lg: 'border-3',
  xl: 'border-4'
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  nombres,
  apellidos,
  rut_usuario,
  size = 'md',
  className = '',
  showBorder = false
}) => {
  const { imageUrl, loading } = useProfileImage(rut_usuario);
  const [imageError, setImageError] = React.useState(false);
  
  const initials = `${nombres?.charAt(0) || ''}${apellidos?.charAt(0) || ''}`.toUpperCase() || 'U';
  
  const baseClasses = `rounded-full flex items-center justify-center font-bold ${sizeClasses[size]}`;
  const borderClass = showBorder ? `${borderClasses[size]} border-blue-300 shadow-lg` : '';
  const loadingClass = loading ? 'animate-pulse' : '';
  
  // Reset error state when imageUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);
  
  if (loading) {
    return (
      <div className={`${baseClasses} ${borderClass} ${loadingClass} bg-gray-200 ${className}`}>
        <div className="w-full h-full rounded-full bg-gray-300"></div>
      </div>
    );
  }

  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={`Foto de perfil de ${nombres} ${apellidos}`}
        className={`${baseClasses} ${borderClass} object-cover ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className={`${baseClasses} ${borderClass} bg-gray-200 text-gray-400 ${className}`}>
      {initials}
    </div>
  );
};