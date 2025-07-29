import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Globe, Clock, Languages, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { GeneralSettings as GeneralSettingsType } from '@/services/settingsService';
import toast from 'react-hot-toast';

interface GeneralSettingsProps {
  settings: GeneralSettingsType;
  onSave: (settings: Partial<GeneralSettingsType>) => Promise<void>;
  isLoading?: boolean;
}

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB)' },
  { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA)' },
  { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' }
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' }
];

const timeFormats = [
  { value: '12', label: '12-hour (AM/PM)' },
  { value: '24', label: '24-hour' }
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' }
];

export default function GeneralSettings({ settings, onSave, isLoading = false }: GeneralSettingsProps) {
  const [formData, setFormData] = useState<GeneralSettingsType>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof GeneralSettingsType, value: string | boolean) => {
    setFormData((prev: GeneralSettingsType) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success('General settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-3">
        <Globe className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            General Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure basic system settings and preferences
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Site Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site Name
            </label>
            <Input
              value={formData.siteName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('siteName', e.target.value)}
              placeholder="Enter site name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site Description
            </label>
            <Input
              value={formData.siteDescription}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('siteDescription', e.target.value)}
              placeholder="Enter site description"
            />
          </div>
        </div>

        {/* Localization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timezone
            </label>
            <Select
              value={formData.timezone}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('timezone', e.target.value)}
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Format
            </label>
            <Select
              value={formData.dateFormat}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('dateFormat', e.target.value)}
            >
              {dateFormats.map(format => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Format
            </label>
            <Select
              value={formData.timeFormat}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('timeFormat', e.target.value)}
            >
              {timeFormats.map(format => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <Select
            value={formData.language}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('language', e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Maintenance Mode */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Maintenance Mode
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enable maintenance mode to restrict access
                </p>
              </div>
            </div>
            <Switch
              checked={formData.maintenanceMode}
              onChange={(checked: boolean) => handleInputChange('maintenanceMode', checked)}
            />
          </div>
          
          {formData.maintenanceMode && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maintenance Message
              </label>
              <Textarea
                value={formData.maintenanceMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('maintenanceMessage', e.target.value)}
                placeholder="Enter maintenance message to display to users"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading || isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
} 