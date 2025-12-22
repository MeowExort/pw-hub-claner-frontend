import React from 'react';
import {LayoutProvider} from '@/widgets/dashboard/LayoutContext';
import {DashboardLayout} from '@/widgets/dashboard/DashboardLayout';

export default function DashboardPage() {
    return (
        <LayoutProvider>
            <DashboardLayout/>
        </LayoutProvider>
    );
}
