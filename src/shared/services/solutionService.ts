import { supabase } from '../../lib/supabase';
import { BaseService } from './baseService';
import { SmartSolution } from '../types/database.types';
import { ApiResponse, SolutionFilters, PaginatedResponse } from '../types/api.types';
import { Profile } from '../../lib/supabase';

export class SolutionService extends BaseService {
  /**
   * Получить все решения с фильтрацией
   */
  async getSolutions(filters?: SolutionFilters): Promise<ApiResponse<(SmartSolution & { developer: Profile })[]>> {
    this.logQuery('smart_solutions', 'getSolutions');

    try {
      let query = supabase
        .from('smart_solutions')
        .select(`
          *,
          developer:profiles!developer_id(*)
        `);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.maturity_level) {
        query = query.eq('maturity_level', filters.maturity_level);
      }

      if (filters?.developer_id) {
        query = query.eq('developer_id', filters.developer_id);
      }

      if (filters?.target_regions && filters.target_regions.length > 0) {
        query = query.overlaps('target_regions', filters.target_regions);
      }

      if (filters?.sortBy) {
        query = query.order(filters.sortBy, { 
          ascending: filters.sortOrder === 'asc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (filters?.page && filters?.pageSize) {
        const from = (filters.page - 1) * filters.pageSize;
        const to = from + filters.pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      return this.handleResponse(data as (SmartSolution & { developer: Profile })[], error, 'getSolutions');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'getSolutions') as any };
    }
  }

  /**
   * Получить решение по ID
   */
  async getSolutionById(id: string): Promise<ApiResponse<SmartSolution & { developer: Profile }>> {
    this.logQuery('smart_solutions', 'getSolutionById');

    try {
      const { data, error } = await supabase
        .from('smart_solutions')
        .select(`
          *,
          developer:profiles!developer_id(*)
        `)
        .eq('id', id)
        .maybeSingle();

      return this.handleResponse(data as SmartSolution & { developer: Profile }, error, 'getSolutionById');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'getSolutionById') as any };
    }
  }

  /**
   * Создать новое решение
   */
  async createSolution(solution: Omit<SmartSolution, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<SmartSolution>> {
    this.logQuery('smart_solutions', 'createSolution');

    try {
      this.validateRequired(solution, ['developer_id', 'title', 'description', 'category', 'maturity_level']);

      const { data, error } = await supabase
        .from('smart_solutions')
        .insert([{
          ...solution,
          technologies: solution.technologies || [],
          target_regions: solution.target_regions || [],
          case_studies: solution.case_studies || [],
          requirements: solution.requirements || {},
        }])
        .select()
        .single();

      return this.handleResponse(data, error, 'createSolution');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'createSolution') as any };
    }
  }

  /**
   * Обновить решение
   */
  async updateSolution(id: string, updates: Partial<SmartSolution>): Promise<ApiResponse<SmartSolution>> {
    this.logQuery('smart_solutions', 'updateSolution');

    try {
      const { data, error } = await supabase
        .from('smart_solutions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      return this.handleResponse(data, error, 'updateSolution');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'updateSolution') as any };
    }
  }

  /**
   * Удалить решение
   */
  async deleteSolution(id: string): Promise<ApiResponse<void>> {
    this.logQuery('smart_solutions', 'deleteSolution');

    try {
      const { error } = await supabase
        .from('smart_solutions')
        .delete()
        .eq('id', id);

      return this.handleResponse(null, error, 'deleteSolution');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'deleteSolution') as any };
    }
  }

  /**
   * Поиск решений по тексту
   */
  async searchSolutions(searchTerm: string, filters?: SolutionFilters): Promise<ApiResponse<(SmartSolution & { developer: Profile })[]>> {
    this.logQuery('smart_solutions', 'searchSolutions');

    try {
      let query = supabase
        .from('smart_solutions')
        .select(`
          *,
          developer:profiles!developer_id(*)
        `)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.maturity_level) {
        query = query.eq('maturity_level', filters.maturity_level);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      return this.handleResponse(data as (SmartSolution & { developer: Profile })[], error, 'searchSolutions');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'searchSolutions') as any };
    }
  }
}

export const solutionService = new SolutionService();

