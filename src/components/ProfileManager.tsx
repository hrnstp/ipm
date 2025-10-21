import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Municipality, Integrator } from '../lib/supabase';
import { User, Building2, Save, Globe, MapPin, Users, Briefcase } from 'lucide-react';

export default function ProfileManager() {
  const { profile } = useAuth();
  const [roleData, setRoleData] = useState<Municipality | Integrator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    organization: '',
    country: '',
    region: '',
    bio: '',
  });
  const [municipalityForm, setMunicipalityForm] = useState({
    city_name: '',
    population: '',
    budget_range: '',
    language: '',
    priorities: [] as string[],
    challenges: [] as string[],
  });
  const [integratorForm, setIntegratorForm] = useState({
    company_name: '',
    expertise_areas: [] as string[],
    service_regions: [] as string[],
    capacity: '',
    languages: [] as string[],
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        organization: profile.organization || '',
        country: profile.country || '',
        region: profile.region || '',
        bio: profile.bio || '',
      });
      loadRoleData();
    }
  }, [profile]);

  const loadRoleData = async () => {
    if (!profile) return;

    try {
      if (profile.role === 'municipality') {
        const { data, error } = await supabase
          .from('municipalities')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setRoleData(data);
          setMunicipalityForm({
            city_name: data.city_name || '',
            population: data.population?.toString() || '',
            budget_range: data.budget_range || '',
            language: data.language || '',
            priorities: data.priorities || [],
            challenges: data.challenges || [],
          });
        }
      } else if (profile.role === 'integrator') {
        const { data, error } = await supabase
          .from('integrators')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setRoleData(data);
          setIntegratorForm({
            company_name: data.company_name || '',
            expertise_areas: data.expertise_areas || [],
            service_regions: data.service_regions || [],
            capacity: data.capacity || '',
            languages: data.languages || [],
          });
        }
      }
    } catch (error) {
      console.error('Error loading role data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          organization: profileForm.organization,
          country: profileForm.country,
          region: profileForm.region,
          bio: profileForm.bio,
        })
        .eq('id', profile.id);

      if (error) throw error;

      if (profile.role === 'municipality' && roleData) {
        await supabase
          .from('municipalities')
          .update({
            city_name: municipalityForm.city_name,
            population: municipalityForm.population ? parseInt(municipalityForm.population) : null,
            budget_range: municipalityForm.budget_range,
            language: municipalityForm.language,
            priorities: municipalityForm.priorities,
            challenges: municipalityForm.challenges,
            updated_at: new Date().toISOString(),
          })
          .eq('id', roleData.id);
      } else if (profile.role === 'integrator' && roleData) {
        await supabase
          .from('integrators')
          .update({
            company_name: integratorForm.company_name,
            expertise_areas: integratorForm.expertise_areas,
            service_regions: integratorForm.service_regions,
            capacity: integratorForm.capacity,
            languages: integratorForm.languages,
            updated_at: new Date().toISOString(),
          })
          .eq('id', roleData.id);
      }

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const smartCityPriorities = [
    'Traffic Management',
    'Energy Efficiency',
    'Water Management',
    'Waste Management',
    'Public Safety',
    'Environmental Monitoring',
    'Citizen Services',
    'Infrastructure Development',
  ];

  const expertiseAreas = [
    'IoT Integration',
    'Data Analytics',
    'Cloud Infrastructure',
    'Network Security',
    'System Architecture',
    'Mobile Applications',
    'GIS Systems',
    'API Development',
  ];

  const globalSouthRegions = [
    'Sub-Saharan Africa',
    'Latin America & Caribbean',
    'South Asia',
    'Southeast Asia',
    'Middle East & North Africa',
    'Central Asia',
  ];

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-bold text-slate-900">Basic Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
            <input
              type="text"
              value={profileForm.organization}
              onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
            <input
              type="text"
              value={profileForm.country}
              onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
            <select
              value={profileForm.region}
              onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Select Region</option>
              {globalSouthRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
          <textarea
            rows={3}
            value={profileForm.bio}
            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            placeholder="Tell others about yourself and your organization..."
          />
        </div>
      </div>

      {profile?.role === 'municipality' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-bold text-slate-900">Municipality Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City Name</label>
              <input
                type="text"
                value={municipalityForm.city_name}
                onChange={(e) => setMunicipalityForm({ ...municipalityForm, city_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Population</label>
              <input
                type="number"
                value={municipalityForm.population}
                onChange={(e) => setMunicipalityForm({ ...municipalityForm, population: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Budget Range</label>
              <select
                value={municipalityForm.budget_range}
                onChange={(e) => setMunicipalityForm({ ...municipalityForm, budget_range: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">Select Range</option>
                <option value="< $50k">Less than $50k</option>
                <option value="$50k - $200k">$50k - $200k</option>
                <option value="$200k - $500k">$200k - $500k</option>
                <option value="$500k - $1M">$500k - $1M</option>
                <option value="> $1M">More than $1M</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
              <input
                type="text"
                value={municipalityForm.language}
                onChange={(e) => setMunicipalityForm({ ...municipalityForm, language: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Priorities</label>
            <div className="grid grid-cols-2 gap-2">
              {smartCityPriorities.map((priority) => (
                <label key={priority} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={municipalityForm.priorities.includes(priority)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMunicipalityForm({
                          ...municipalityForm,
                          priorities: [...municipalityForm.priorities, priority],
                        });
                      } else {
                        setMunicipalityForm({
                          ...municipalityForm,
                          priorities: municipalityForm.priorities.filter((p) => p !== priority),
                        });
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">{priority}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {profile?.role === 'integrator' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-bold text-slate-900">Integrator Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={integratorForm.company_name}
                onChange={(e) => setIntegratorForm({ ...integratorForm, company_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
              <select
                value={integratorForm.capacity}
                onChange={(e) => setIntegratorForm({ ...integratorForm, capacity: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">Select Capacity</option>
                <option value="1-2 projects">1-2 projects</option>
                <option value="3-5 projects">3-5 projects</option>
                <option value="5-10 projects">5-10 projects</option>
                <option value="10+ projects">10+ projects</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Expertise Areas</label>
            <div className="grid grid-cols-2 gap-2">
              {expertiseAreas.map((area) => (
                <label key={area} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integratorForm.expertise_areas.includes(area)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIntegratorForm({
                          ...integratorForm,
                          expertise_areas: [...integratorForm.expertise_areas, area],
                        });
                      } else {
                        setIntegratorForm({
                          ...integratorForm,
                          expertise_areas: integratorForm.expertise_areas.filter((a) => a !== area),
                        });
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">{area}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Service Regions</label>
            <div className="grid grid-cols-2 gap-2">
              {globalSouthRegions.map((region) => (
                <label key={region} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integratorForm.service_regions.includes(region)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIntegratorForm({
                          ...integratorForm,
                          service_regions: [...integratorForm.service_regions, region],
                        });
                      } else {
                        setIntegratorForm({
                          ...integratorForm,
                          service_regions: integratorForm.service_regions.filter((r) => r !== region),
                        });
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">{region}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
