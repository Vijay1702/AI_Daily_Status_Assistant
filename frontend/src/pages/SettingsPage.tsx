import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/services/api';
import { useToastStore } from '@/store/toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import clsx from 'clsx';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    masterNo: '',
    dailyHours: 8,
    preferredModel: 'llama3',
    reminderTime: '18:00',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        masterNo: user.masterNo,
        dailyHours: user.dailyHours,
        preferredModel: user.preferredModel,
        reminderTime: user.reminderTime,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'dailyHours' ? Number(value) : value,
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (formData.dailyHours < 1 || formData.dailyHours > 24) {
        newErrors.dailyHours = 'Hours must be between 1 and 24';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      const response = await apiClient.updateProfile(formData);
      if (response.data.success) {
        updateUser(response.data.data);
        addToast('Settings updated successfully!', 'success');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update settings';
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-lg">
        <h1 className="text-headline-lg text-on-surface-dark font-semibold font-inter">
          Settings
        </h1>
        <p className="text-body-md text-outline mt-xs font-inter">
          Manage your account preferences and AI model settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-lg">
        {/* Profile Section */}
        <div className="bg-surface-dark-elevated border border-outline-dark rounded-lg p-lg shadow-subtle">
          <h2 className="text-title-md font-semibold mb-lg text-on-surface-dark font-inter">
            Profile Information
          </h2>
          <div className="space-y-md">
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            <Input
              label="Master Number"
              name="masterNo"
              value={formData.masterNo}
              onChange={handleChange}
              disabled
              helperText="Master number cannot be changed"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled
              helperText="Email cannot be changed"
            />
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-surface-dark-elevated border border-outline-dark rounded-lg p-lg shadow-subtle">
          <h2 className="text-title-md font-semibold mb-lg text-on-surface-dark font-inter">
            Preferences
          </h2>
          <div className="space-y-md">
            {/* Daily Working Hours */}
            <div>
              <label className="block text-label-md font-medium text-on-surface-dark mb-sm font-inter">
                Daily Working Hours
              </label>
              <select
                name="dailyHours"
                value={formData.dailyHours}
                onChange={handleChange}
                className={clsx(
                  'w-full px-md py-sm border rounded-md text-body-md text-on-surface-dark transition-all duration-200',
                  'bg-surface-dark-container-high focus:bg-surface-dark-elevated',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-surface-dark-base',
                  'border-outline-dark hover:border-outline cursor-pointer'
                )}
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {h} hours
                  </option>
                ))}
              </select>
              {errors.dailyHours && (
                <p className="text-error text-body-md mt-xs font-inter">{errors.dailyHours}</p>
              )}
              <p className="text-outline text-body-md mt-xs font-inter">
                Default hours used for daily entries
              </p>
            </div>

            {/* AI Model Selection */}
            <div>
              <label className="block text-label-md font-medium text-on-surface-dark mb-sm font-inter">
                Preferred AI Model
              </label>
              <select
                name="preferredModel"
                value={formData.preferredModel}
                onChange={handleChange}
                className={clsx(
                  'w-full px-md py-sm border rounded-md text-body-md text-on-surface-dark transition-all duration-200',
                  'bg-surface-dark-container-high focus:bg-surface-dark-elevated',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-surface-dark-base',
                  'border-outline-dark hover:border-outline cursor-pointer'
                )}
              >
                <option value="llama3">Llama 3 (Recommended)</option>
                <option value="qwen3">Qwen 3 (Faster)</option>
                <option value="mistral">Mistral (Quality)</option>
              </select>
              <p className="text-outline text-body-md mt-xs font-inter">
                Used for processing your status updates
              </p>
            </div>

            {/* Reminder Time */}
            <div>
              <label className="block text-label-md font-medium text-on-surface-dark mb-sm font-inter">
                Reminder Time
              </label>
              <input
                type="time"
                name="reminderTime"
                value={formData.reminderTime}
                onChange={handleChange}
                className={clsx(
                  'w-full px-md py-sm border rounded-md text-body-md text-on-surface-dark transition-all duration-200',
                  'bg-surface-dark-container-high focus:bg-surface-dark-elevated',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-surface-dark-base',
                  'border-outline-dark hover:border-outline cursor-pointer'
                )}
              />
              <p className="text-outline text-body-md mt-xs font-inter">
                Time to receive daily status reminders
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-md">
          <Button type="submit" variant="primary" isLoading={loading}>
            Save Changes
          </Button>
          <Button type="button" variant="secondary" disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
