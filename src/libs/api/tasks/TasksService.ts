
import { ApiConfig } from "../ApiConfig";
import { ApiException } from "../exceptions/ApiException";

interface Itarefa{
    id: number;
    body: string;
    postId: number;
}

const getAll = async (): Promise<Itarefa[] | ApiException> => {
    try {
        const { data } = await ApiConfig().get('/tarefas');
        return data;
    }catch (error: any){
        return new ApiException(error.message || "Erro ao consultar registros.")
    }
};


const getById = async (id: number): Promise<Itarefa | ApiException> => {
    try {
        const { data } = await ApiConfig().get(`/tarefas/${id}`);
        return data;
    }catch (error: any){
        return new ApiException(error.message || "Erro ao consultar registro.")
    }
};

const create = async (dataToCreate: Omit<Itarefa, 'id'>): Promise<Itarefa | ApiException> => {
    try {
        const { data } = await ApiConfig().post('/tarefas', dataToCreate);
        return data;
    }catch (error: any){
        return new ApiException(error.message || "Erro ao atualizar registro.")
    }
};


const updateById = async (id: string, dataToUpdate: Itarefa): Promise<Itarefa | ApiException> => {
    try {
        const { data } = await ApiConfig().put(`/tarefas/${id}`, dataToUpdate);
        return data;
    }catch (error: any){
        return new ApiException(error.message || "Erro ao cadastrar registro.")
    }
};

const deleteById = async (id: number): Promise<Itarefa | ApiException> => {
    try {
        const { data } = await ApiConfig().delete(`/tarefas/${id}`);
        return data;
    }catch (error: any){
        return new ApiException(error.message || "Erro ao apagar registro.")
    }
};

export const tasksService = {
    getAll,
    getById,
    create,
    updateById,
    deleteById,
};

// https://www.youtube.com/watch?v=T9hhp5qPykg