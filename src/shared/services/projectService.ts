import { supabase } from '../../lib/supabase';
import { BaseService } from './baseService';
import { Project } from '../types/database.types';
import { ApiResponse, ProjectFilters } from '../types/api.types';

export class ProjectService extends BaseService {
  /**
   * Получить все проекты с фильтрацией
   */
  async getProjects(filters?: ProjectFilters): Promise<ApiResponse<Project[]>> {
    this.logQuery('projects', 'getProjects', filters);

    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          solution:smart_solutions(*),
          municipality:municipalities(*),
          integrator:integrators(*),
          developer:profiles!developer_id(*)
        `);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.developer_id) {
        query = query.eq('developer_id', filters.developer_id);
      }

      if (filters?.municipality_id) {
        query = query.eq('municipality_id', filters.municipality_id);
      }

      if (filters?.integrator_id) {
        query = query.eq('integrator_id', filters.integrator_id);
      }

      if (filters?.sortBy) {
        query = query.order(filters.sortBy, { 
          ascending: filters.sortOrder === 'asc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      return this.handleResponse(data as Project[], error, 'getProjects');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'getProjects') as any };
    }
  }

  /**
   * Получить проект по ID
   */
  async getProjectById(id: string): Promise<ApiResponse<Project>> {
    this.logQuery('projects', 'getProjectById', { id });

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          solution:smart_solutions(*),
          municipality:municipalities(*),
          integrator:integrators(*),
          developer:profiles!developer_id(*)
        `)
        .eq('id', id)
        .maybeSingle();

      return this.handleResponse(data as Project, error, 'getProjectById');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'getProjectById') as any };
    }
  }

  /**
   * Создать новый проект
   */
  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Project>> {
    this.logQuery('projects', 'createProject', project);

    try {
      this.validateRequired(project, ['solution_id', 'municipality_id', 'developer_id', 'title']);

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...project,
          milestones: project.milestones || [],
        }])
        .select()
        .single();

      return this.handleResponse(data, error, 'createProject');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'createProject') as any };
    }
  }

  /**
   * Обновить проект
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<ApiResponse<Project>> {
    this.logQuery('projects', 'updateProject', { id, updates });

    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      return this.handleResponse(data, error, 'updateProject');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'updateProject') as any };
    }
  }

  /**
   * Удалить проект
   */
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    this.logQuery('projects', 'deleteProject', { id });

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      return this.handleResponse(null, error, 'deleteProject');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'deleteProject') as any };
    }
  }
}

export const projectService = new ProjectService();

