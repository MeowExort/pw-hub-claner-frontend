import React from 'react';
import {CharacterClass} from '@/shared/types';

import varIcon from '@/../assets/classes/var.png';
import magIcon from '@/../assets/classes/mag.png';
import ganIcon from '@/../assets/classes/gan.png';
import tankIcon from '@/../assets/classes/tank.png';
import druIcon from '@/../assets/classes/dru.png';
import mkIcon from '@/../assets/classes/mk.png';
import lukIcon from '@/../assets/classes/luk.png';
import pristIcon from '@/../assets/classes/prist.png';
import palIcon from '@/../assets/classes/pal.png';
import sinIcon from '@/../assets/classes/sin.png';
import shamIcon from '@/../assets/classes/sham.png';
import bardIcon from '@/../assets/classes/bard.png';
import sikIcon from '@/../assets/classes/sik.png';
import mistIcon from '@/../assets/classes/mist.png';
import dkIcon from '@/../assets/classes/dk.png';
import gostIcon from '@/../assets/classes/gost.png';
import kosaIcon from '@/../assets/classes/kosa.png';

const CLASS_ICONS: Record<CharacterClass, string> = {
    'Воин': varIcon,
    'Маг': magIcon,
    'Стрелок': ganIcon,
    'Оборотень': tankIcon,
    'Друид': druIcon,
    'Странник': mkIcon,
    'Лучник': lukIcon,
    'Жрец': pristIcon,
    'Паладин': palIcon,
    'Убийца': sinIcon,
    'Шаман': shamIcon,
    'Бард': bardIcon,
    'Страж': sikIcon,
    'Мистик': mistIcon,
    'Дух крови': dkIcon,
    'Призрак': gostIcon,
    'Жнец': kosaIcon,
};

interface ClassIconProps {
    cls?: CharacterClass | string;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const ClassIcon: React.FC<ClassIconProps> = ({cls, size = 20, className, style}) => {
    if (!cls || !CLASS_ICONS[cls as CharacterClass]) return null;
    return (
        <img
            src={CLASS_ICONS[cls as CharacterClass]}
            alt={cls}
            className={className}
            width={size}
            height={size}
            style={{verticalAlign: 'middle', marginRight: 4, objectFit: 'contain', ...style}}
        />
    );
};
