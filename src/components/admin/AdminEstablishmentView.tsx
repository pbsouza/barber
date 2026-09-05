import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../BrandLogo';
import { EstablishmentInfo } from '../../types';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Globe,
  Save,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const AdminEstablishmentView: React.FC = () => {
  const { establishmentInfo, updateEstablishmentInfo } = useApp();

  const [formData, setFormData] = useState<EstablishmentInfo>(establishmentInfo);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (field: keyof EstablishmentInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await updateEstablishmentInfo(formData);
      setSuccessMessage('Dados do estabelecimento e contatos atualizados com sucesso!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao salvar as informações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-[#181D21] border border-[#2D3640] rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#CBA358]/10 border border-[#CBA358]/30 flex items-center justify-center text-[#CBA358]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F6F2EA] font-['Cabinet_Grotesk',sans-serif]">
                Dados do Estabelecimento & Contatos
              </h2>
              <p className="text-xs text-[#A6B2BD] mt-0.5">
                Altere endereço, telefones, WhatsApp, e-mail de atendimento, e-mail administrativo e horários.
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#CBA358] to-[#B88C3E] hover:from-[#DFB86C] hover:to-[#CBA358] text-[#14181B] text-xs font-black uppercase tracking-wider transition shadow-lg shadow-[#CBA358]/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>

        {successMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium animate-in fade-in">
            {errorMessage}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identificação Geral */}
          <div className="bg-[#181D21] border border-[#2D3640] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[#F6F2EA] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#CBA358]" />
              Identidade do Estabelecimento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  Nome da Barbearia / Empresa
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Lucas Hoffmann Barber"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  Slogan / Subtítulo
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="Ex: Estética Masculina de Alto Padrão"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                Diferenciais / Descrição Institucional
              </label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Ex: Toalha quente com óleos essenciais, barboterapia, cerveja gelada e café gourmet de cortesia."
                className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
              />
            </div>
          </div>

          {/* Endereço e Localização */}
          <div className="bg-[#181D21] border border-[#2D3640] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[#F6F2EA] uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#CBA358]" />
              Endereço & Localização Física
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  Logradouro e Número
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Ex: Rua das Palmeiras, 450"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => handleChange('neighborhood', e.target.value)}
                  placeholder="Ex: Centro"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Ex: São Paulo"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="Ex: SP"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  placeholder="Ex: 01001-000"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                Link do Google Maps (Rota / Localização)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-[#8895A3] absolute left-3.5 top-3" />
                <input
                  type="url"
                  value={formData.googleMapsUrl || ''}
                  onChange={(e) => handleChange('googleMapsUrl', e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                />
              </div>
            </div>
          </div>

          {/* Canais de Contato & Reconhecimento do Administrador */}
          <div className="bg-[#181D21] border border-[#2D3640] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[#F6F2EA] uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#CBA358]" />
              Contatos & Canais de Atendimento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  Telefone Exibido (Formatado)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  WhatsApp Oficial (Apenas números com DDD)
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 5511987654321"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                  required
                />
                <p className="text-[10px] text-[#8895A3] mt-1">
                  Usado para os disparos de lembretes e confirmações no WhatsApp.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  E-mail Público de Atendimento
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contato@lucashoffmannbarber.com.br"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  Instagram Oficial
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  placeholder="@lucashoffmannbarber"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                />
              </div>
            </div>

            {/* E-mail de Reconhecimento do Administrador */}
            <div className="p-4 rounded-2xl bg-[#CBA358]/10 border border-[#CBA358]/30">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-[#CBA358]" />
                <span className="text-xs font-bold text-[#E5C158] uppercase tracking-wide">
                  E-mail do Administrador (Reconhecimento Inteligente)
                </span>
              </div>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => handleChange('adminEmail', e.target.value)}
                placeholder="belchior87@gmail.com"
                className="w-full bg-[#13171A] border border-[#CBA358]/40 rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                required
              />
              <p className="text-[11px] text-[#A6B2BD] mt-2 leading-relaxed">
                Quando qualquer pessoa fizer login com este e-mail, o sistema reconhecerá automaticamente a conta como <strong>Administrador</strong> e redirecionará direto para este Painel ADM.
              </p>
            </div>
          </div>

          {/* Horários de Funcionamento */}
          <div className="bg-[#181D21] border border-[#2D3640] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[#F6F2EA] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#CBA358]" />
              Horários de Atendimento ao Público
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  Segunda a Sexta
                </label>
                <input
                  type="text"
                  value={formData.weekdaysHours}
                  onChange={(e) => handleChange('weekdaysHours', e.target.value)}
                  placeholder="Segunda a Sexta: 09:00 às 20:00"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  Sábado
                </label>
                <input
                  type="text"
                  value={formData.saturdayHours}
                  onChange={(e) => handleChange('saturdayHours', e.target.value)}
                  placeholder="Sábado: 08:30 às 19:00"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C5CCD3] mb-1.5">
                  Domingo / Feriados
                </label>
                <input
                  type="text"
                  value={formData.sundayHours}
                  onChange={(e) => handleChange('sundayHours', e.target.value)}
                  placeholder="Domingo: Fechado (Consultar feriados)"
                  className="w-full bg-[#13171A] border border-[#2C343D] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F2EA] placeholder-[#6E7B8B] focus:outline-none focus:border-[#CBA358]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Live Preview Card */}
        <div className="space-y-6">
          <div className="sticky top-24 bg-gradient-to-b from-[#1C2227] to-[#14181B] border border-[#CBA358]/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A333C]">
              <span className="text-xs font-bold text-[#E5C158] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#CBA358]" />
                Prévia em Tempo Real
              </span>
              <span className="text-[10px] text-[#8895A3]">Visão do Cliente</span>
            </div>

            {/* Shop Card */}
            <div className="text-center py-2">
              <div className="flex justify-center mb-3">
                <BrandLogo variant="icon" />
              </div>
              <h4 className="text-lg font-black text-[#F6F2EA] font-['Cabinet_Grotesk',sans-serif] uppercase tracking-wide">
                {formData.name || 'Lucas Hoffmann Barber'}
              </h4>
              <p className="text-xs text-[#CBA358] font-medium mt-0.5">
                {formData.tagline || 'Estética Masculina de Alto Padrão'}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3 text-xs text-[#A6B2BD] pt-2 border-t border-[#262E35]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#CBA358] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#F6F2EA]">{formData.address}, {formData.neighborhood}</p>
                  <p className="text-[11px] text-[#8895A3]">{formData.city} - {formData.state} • CEP {formData.postalCode}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#CBA358] shrink-0" />
                <div>
                  <p className="font-semibold text-[#F6F2EA]">{formData.phone}</p>
                  <p className="text-[10px] text-[#8895A3]">WhatsApp: +{formData.whatsapp}</p>
                </div>
              </div>

              {formData.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#CBA358] shrink-0" />
                  <span className="text-[#D0D7DE]">{formData.email}</span>
                </div>
              )}

              {formData.instagram && (
                <div className="flex items-center gap-2.5">
                  <Instagram className="w-4 h-4 text-[#CBA358] shrink-0" />
                  <span className="text-[#D0D7DE]">{formData.instagram}</span>
                </div>
              )}

              <div className="flex items-start gap-2.5 pt-2 border-t border-[#262E35]">
                <Clock className="w-4 h-4 text-[#CBA358] shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11px]">
                  <p className="text-[#F6F2EA]">{formData.weekdaysHours}</p>
                  <p className="text-[#A6B2BD]">{formData.saturdayHours}</p>
                  <p className="text-[#8895A3]">{formData.sundayHours}</p>
                </div>
              </div>
            </div>

            {formData.googleMapsUrl && (
              <a
                href={formData.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-[#20272D] hover:bg-[#2A333C] text-xs font-semibold text-[#CBA358] border border-[#2D3640] flex items-center justify-center gap-2 transition"
              >
                <span>Ver no Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#CBA358] to-[#B88C3E] hover:from-[#DFB86C] hover:to-[#CBA358] text-[#14181B] text-xs font-black uppercase tracking-wider transition shadow-lg shadow-[#CBA358]/20 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Aplicar Alterações'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
