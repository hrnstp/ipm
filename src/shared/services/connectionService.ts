import { supabase } from '../../lib/supabase';
import { BaseService } from './baseService';
import { Connection } from '../types/database.types';
import { ApiResponse, ConnectionFilters } from '../types/api.types';

export class ConnectionService extends BaseService {
  /**
   * Получить все связи с фильтрацией
   */
  async getConnections(filters?: ConnectionFilters): Promise<ApiResponse<Connection[]>> {
    this.logQuery('connections', 'getConnections', filters);

    try {
      let query = supabase
        .from('connections')
        .select(`
          *,
          initiator:profiles!initiator_id(*),
          recipient:profiles!recipient_id(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.connection_type) {
        query = query.eq('connection_type', filters.connection_type);
      }

      if (filters?.user_id) {
        query = query.or(`initiator_id.eq.${filters.user_id},recipient_id.eq.${filters.user_id}`);
      }

      if (filters?.sortBy) {
        query = query.order(filters.sortBy, { 
          ascending: filters.sortOrder === 'asc' 
        });
      }

      const { data, error } = await query;

      return this.handleResponse(data as Connection[], error, 'getConnections');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'getConnections') as any };
    }
  }

  /**
   * Создать новую связь
   */
  async createConnection(connection: Omit<Connection, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Connection>> {
    this.logQuery('connections', 'createConnection', connection);

    try {
      this.validateRequired(connection, ['initiator_id', 'recipient_id', 'connection_type']);

      // Проверка на самосвязь
      if (connection.initiator_id === connection.recipient_id) {
        throw new Error('Cannot create connection with yourself');
      }

      const { data, error } = await supabase
        .from('connections')
        .insert([{
          ...connection,
          status: connection.status || 'pending',
        }])
        .select()
        .single();

      return this.handleResponse(data as Connection, error, 'createConnection');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'createConnection') as any };
    }
  }

  /**
   * Обновить статус связи
   */
  async updateConnectionStatus(
    id: string, 
    status: 'pending' | 'accepted' | 'rejected'
  ): Promise<ApiResponse<Connection>> {
    this.logQuery('connections', 'updateConnectionStatus', { id, status });

    try {
      const { data, error } = await supabase
        .from('connections')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      return this.handleResponse(data as Connection, error, 'updateConnectionStatus');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'updateConnectionStatus') as any };
    }
  }

  /**
   * Удалить связь
   */
  async deleteConnection(id: string): Promise<ApiResponse<void>> {
    this.logQuery('connections', 'deleteConnection', { id });

    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', id);

      return this.handleResponse(null, error, 'deleteConnection');
    } catch (error) {
      return { data: null, error: this.handleError(error, 'deleteConnection') as any };
    }
  }
}

export const connectionService = new ConnectionService();

