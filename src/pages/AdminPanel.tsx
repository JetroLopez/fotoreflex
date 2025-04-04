import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import ClientesPage from '@/components/admin/ClientesPage';
import OrdenesPage from '@/components/admin/OrdenesPage';
import FotografiasPage from '@/components/admin/FotografiasPage';
import AjustesPage from '@/components/admin/AjustesPage';
import GruposPage from '@/components/admin/GruposPage';
import DetalleGrupoPage from '@/components/admin/grupos/DetalleGrupoPage';
import ConfiguracionPage from '@/components/admin/configuracion/ConfiguracionPage';
import ContactoPage from '@/pages/admin/ContactoPage';

const AdminPanel = () => {
  return (
    <AuthProvider>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/grupos" element={<GruposPage />} />
          <Route path="/grupos/:id" element={<DetalleGrupoPage />} />
          <Route path="/ordenes" element={<OrdenesPage />} />
          <Route path="/fotografias" element={<FotografiasPage />} />
          <Route path="/ajustes" element={<AjustesPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/contacto" element={<ContactoPage />} />
        </Routes>
      </AdminLayout>
    </AuthProvider>
  );
};

export default AdminPanel;
