import { supabase } from '../../lib/supabase';
import { BaseService } from './baseService';
import { RFP, Bid } from '../types/database.types';
import { ApiResponse, RFPFilters } from '../types/api.types';

export class RFPService extends BaseService {
  /**
   * Получить все RFP с фильтрацией
   */
  async getRFPs(filters?: RFPFilters): Promise<ApiResponse<RFP[]>> {
    this.logQuery('rfp_requests', 'getRFPs', filters);

    try {
      let query = supabase
        .from('rfp_requests')
        .select(`
          *,
          municipality:municipalities(city_name, profile_id),
          project:project_id(title, status)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.municipality_id) {
        query = query.eq('municipality_id', filters.municipality_id);
      }

      if (filters?.sortBy) {
        query = query.order(filters.sortBy, { 
          ascending: filters.sortOrder === 'asc' 
        });
      }

      const { data, error } = await query;

      if (error) {
        return this.handleResponse(null, error, 'getRFPs');
      }

      // Добавить количество заявок для каждого RFP
      const rfpsWithBids = await Promise.all(
        (data || []).map(async (rfp) => {
          const { count } = await supabase
            .from('bids')
            .select('id', { count: 'exact', head: true })
            .eq('rfp_id', rfp.id);
          return { ...rfp, bid_count: count || 0 };
        })
      );

      return { data: rfpsWithBids as RFP[], error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error, 'getRFPs') as any };
    }
  }

  /**
   * Получить RFP по ID
   */
  async getRFPById(id: string): Promise<ApiResponse<RFP>> {
    this.logQuery('rfp_requests', 'getRFPById', { id });

    try {
      const { data, error } = await supabase
        .from('rfp_requests')
        .select(`
          *,
          municipality:municipalities(city_name, profile_id),
          project:project_id(title, status)
        `)
        .eq('id', id)
        .maybeSingle();

      return this.handleResponse(data as RFP, error, 'getRFPById');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'getRFPById') as any };
    }
  }

  /**
   * Создать новый RFP
   */
  async createRFP(rfp: Omit<RFP, 'id' | 'created_at' | 'bid_count'>): Promise<ApiResponse<RFP>> {
    this.logQuery('rfp_requests', 'createRFP', rfp);

    try {
      this.validateRequired(rfp, ['title', 'description', 'category', 'budget_min', 'budget_max', 'deadline', 'created_by']);

      const { data, error } = await supabase
        .from('rfp_requests')
        .insert([{
          ...rfp,
          requirements: rfp.requirements || {},
          evaluation_criteria: rfp.evaluation_criteria || {},
          status: rfp.status || 'draft',
        }])
        .select()
        .single();

      return this.handleResponse(data as RFP, error, 'createRFP');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'createRFP') as any };
    }
  }

  /**
   * Обновить RFP
   */
  async updateRFP(id: string, updates: Partial<RFP>): Promise<ApiResponse<RFP>> {
    this.logQuery('rfp_requests', 'updateRFP', { id, updates });

    try {
      const { data, error } = await supabase
        .from('rfp_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return this.handleResponse(data as RFP, error, 'updateRFP');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'updateRFP') as any };
    }
  }

  /**
   * Удалить RFP
   */
  async deleteRFP(id: string): Promise<ApiResponse<void>> {
    this.logQuery('rfp_requests', 'deleteRFP', { id });

    try {
      const { error } = await supabase
        .from('rfp_requests')
        .delete()
        .eq('id', id);

      return this.handleResponse(null, error, 'deleteRFP');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'deleteRFP') as any };
    }
  }

  /**
   * Получить заявки для RFP
   */
  async getBidsForRFP(rfpId: string): Promise<ApiResponse<Bid[]>> {
    this.logQuery('bids', 'getBidsForRFP', { rfpId });

    try {
      const { data, error } = await supabase
        .from('bids')
        .select(`
          *,
          developer:profiles!developer_id(id, full_name, organization),
          solution:smart_solutions(id, title)
        `)
        .eq('rfp_id', rfpId)
        .order('submitted_at', { ascending: false });

      return this.handleResponse(data as Bid[], error, 'getBidsForRFP');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'getBidsForRFP') as any };
    }
  }

  /**
   * Создать заявку на RFP
   */
  async createBid(bid: Omit<Bid, 'id' | 'submitted_at' | 'status'>): Promise<ApiResponse<Bid>> {
    this.logQuery('bids', 'createBid', bid);

    try {
      this.validateRequired(bid, ['rfp_id', 'developer_id', 'solution_id', 'proposal_text', 'price', 'timeline']);

      const { data, error } = await supabase
        .from('bids')
        .insert([{
          ...bid,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        }])
        .select()
        .single();

      return this.handleResponse(data as Bid, error, 'createBid');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'createBid') as any };
    }
  }

  /**
   * Обновить статус заявки
   */
  async updateBidStatus(bidId: string, status: 'pending' | 'accepted' | 'rejected'): Promise<ApiResponse<Bid>> {
    this.logQuery('bids', 'updateBidStatus', { bidId, status });

    try {
      const { data, error } = await supabase
        .from('bids')
        .update({ status })
        .eq('id', bidId)
        .select()
        .single();

      return this.handleResponse(data as Bid, error, 'updateBidStatus');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'updateBidStatus') as any };
    }
  }
}

export const rfpService = new RFPService();

